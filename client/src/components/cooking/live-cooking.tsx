import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Mic, MicOff, Play, Pause, SkipForward, SkipBack, AlertTriangle, Info, CheckCircle, ExternalLink, Volume2, VolumeX, Clock, ArrowLeft, Repeat, StopCircle, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { fetchCookingSteps, fetchCookingAssistance } from '@/lib/openai';
import { apiFetch } from '@/lib/queryClient';
import { classifyAiRequestError } from '@/lib/rateLimitHandler';
import { elevenLabsClient, browserTTSClient, COOKING_VOICE_SETTINGS, type VoiceSettings } from '@/lib/elevenlabs';
import { AudioProcessor } from '@/lib/audioUtils';
import { UsageTracker } from '@/lib/usageTracker';
import { calculateTimeDomainVolume, isOperationalMessage, VOICE_RECORDING_SILENCE_CONFIG } from '@/lib/voiceRecording';
import { useStartCookingSession, useUpdateCookingSession, useCompleteCookingSession } from '@/hooks/useCookingSession';
import { useToast } from '@/hooks/use-toast';
import { isGuestUser, useAuth } from '@/hooks/useAuth';
import { COOKING_SESSION_STORAGE_KEY } from '@/lib/planningCache';

interface SavedCookingSession {
  recipeName: string;
  recipeId: string;
  currentStepIndex: number;
  timer: number;
  isTimerRunning: boolean;
  savedAt: number;
  steps?: RecipeStep[];
  ingredients?: RecipeIngredient[];
  cookingSessionId?: number;
  cookingStartedAt?: string;
  profileFingerprint?: string;
}

interface RecipeStep {
  id: number;
  actionLabel?: string;
  instruction: string;
  duration?: number;
  tips: string;
  visualCues: string;
  commonMistakes: string;
  safetyLevel: 'critical' | 'important' | 'minor';
}

interface RecipeIngredient {
  name: string;
  quantity?: string;
  forSteps?: number[];
}

interface ScreenWakeLockSentinel extends EventTarget {
  released: boolean;
  release: () => Promise<void>;
}

type NavigatorWithWakeLock = Navigator & {
  wakeLock?: {
    request: (type: 'screen') => Promise<ScreenWakeLockSentinel>;
  };
};

interface StepLoadIssue {
  title: string;
  description: string;
}

interface AssistanceIssue {
  title: string;
  description: string;
}

interface RecipeRecommendation {
  id: string;
  recipeName: string;
  description: string;
  cookTime: number;
  difficulty: string;
  cuisine: string;
  pantryMatch: number;
  missingIngredients: string[];
  // Slop Bowl additions (all optional — manual flow leaves them undefined)
  isFusion?: boolean;
  ingredients?: string[];      // actual pantry items used — fed to cooking steps
  equipment?: string[];        // user's kitchen equipment — fed to cooking steps
  overview?: string;           // short tagline from slop-bowl response
}

function formatInstructionWithTips(instruction: string, tips?: string) {
  const trimmedInstruction = instruction.trim();
  const trimmedTips = tips?.trim();

  if (!trimmedTips) {
    return trimmedInstruction;
  }

  const separator = /[.!?]$/.test(trimmedInstruction) ? ' ' : '. ';
  return `${trimmedInstruction}${separator}${trimmedTips}`;
}

function createBasicCookingSteps(recipeName: string): RecipeStep[] {
  return [
    {
      id: 1,
      actionLabel: 'Prep Ingredients',
      instruction: `Prepare ingredients for ${recipeName}`,
      tips: 'Gather all ingredients and prep workspace',
      visualCues: 'All ingredients should be within reach',
      commonMistakes: 'Not having everything ready before starting',
      safetyLevel: 'important',
    },
    {
      id: 2,
      actionLabel: 'Start Cooking',
      instruction: `Begin cooking ${recipeName}`,
      tips: 'Follow the recipe step by step',
      visualCues: 'Start with the base ingredients',
      commonMistakes: 'Rushing the cooking process',
      safetyLevel: 'important',
    },
  ];
}

function formatTimerDuration(seconds: number) {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  if (minutes > 0 && remainingSeconds > 0) {
    return `${minutes} min ${remainingSeconds} sec`;
  }

  if (minutes > 0) {
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
  }

  return `${remainingSeconds} ${remainingSeconds === 1 ? 'second' : 'seconds'}`;
}

function formatTimerClock(seconds: number) {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function normalizeInstructionText(instruction: string) {
  return instruction.replace(/\s+/g, ' ').trim();
}

function isPlaceholderInstruction(instruction: string) {
  const normalized = normalizeInstructionText(instruction);
  if (normalized.length === 0) {
    return true;
  }

  const lower = normalized.toLowerCase();
  const compact = lower.replace(/[.:;,\-—–_()[\]{}'"!?]+/g, ' ').replace(/\s+/g, ' ').trim();

  if (/^step\s*\d+$/i.test(compact)) {
    return true;
  }

  return [
    'tbd',
    'to be determined',
    'n a',
    'na',
    'none',
    'null',
    'undefined',
    'placeholder',
    'lorem ipsum',
    'no instructions',
    'no instructions available',
    'instructions unavailable',
    'instruction unavailable',
    'add instruction here',
    'details to come',
    'follow the recipe',
    'follow recipe instructions',
    'follow the recipe instructions',
  ].includes(compact);
}

const STEP_ACTION_LABEL_MAX_WORDS = 5;
const STEP_ACTION_LABEL_MAX_CHARS = 24;

function parseTimerDurationSeconds(value: string) {
  const normalized = value.replace(/[–—]/g, '-');
  const candidates: number[] = [];
  const durationPattern = /\b(\d+(?:\.\d+)?)\s*(seconds?|secs?|minutes?|mins?)\b/gi;
  let match: RegExpExecArray | null;

  while ((match = durationPattern.exec(normalized)) !== null) {
    const amount = Number.parseFloat(match[1]);
    const unit = match[2].toLowerCase();
    const seconds = unit.startsWith('sec') ? amount : amount * 60;
    if (Number.isFinite(seconds) && seconds > 0) {
      candidates.push(seconds);
    }
  }

  return candidates.length > 0 ? Math.round(Math.max(...candidates)) : null;
}

function getStepTimerDurationSeconds(step?: RecipeStep) {
  if (!step) {
    return null;
  }

  if (typeof step.duration === 'number' && Number.isFinite(step.duration)) {
    const roundedSeconds = Math.round(step.duration);
    return roundedSeconds > 0 ? roundedSeconds : null;
  }

  return parseTimerDurationSeconds(step.instruction);
}

function formatTimerControlDuration(seconds: number) {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  if (minutes > 0 && remainingSeconds === 0) {
    return `${minutes} min`;
  }

  if (minutes > 0) {
    return `${minutes} min ${remainingSeconds} sec`;
  }

  return `${remainingSeconds} sec`;
}

function normalizeActionLabelForComparison(label: string) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function getActionLabelWords(label: string) {
  return label.match(/[A-Za-z0-9']+/g) || [];
}

function hasMeasurementInActionLabel(label: string) {
  return /\d|[¼½¾⅓⅔⅛⅜⅝⅞]/.test(label) ||
    /\b(cups?|tablespoons?|tbsp|teaspoons?|tsp|ounces?|oz|grams?|g|milliliters?|ml|pounds?|lbs?|minutes?|mins?|seconds?|degrees?|fahrenheit|celsius|inches?|cm)\b/i.test(label);
}

function actionLabelFitsPreview(label: string) {
  return getActionLabelWords(label).length <= STEP_ACTION_LABEL_MAX_WORDS &&
    label.length <= STEP_ACTION_LABEL_MAX_CHARS &&
    !hasMeasurementInActionLabel(label);
}

function normalizeStepActionLabel(label: unknown, instruction = '') {
  if (typeof label !== 'string') return undefined;

  const normalized = normalizeInstructionText(label);
  if (isPlaceholderInstruction(normalized)) return undefined;

  const compact = normalizeActionLabelForComparison(normalized);
  const lowerInstruction = instruction.toLowerCase();
  if (compact === 'push vegetables side') {
    return 'Push Vegetables Aside';
  }
  if ((compact === 'add cold cooked' || compact === 'add cold cooked rice') && /\brice\b/.test(`${compact} ${lowerInstruction}`)) {
    return 'Add Cold Rice';
  }
  if (compact === 'bring 4 cups') {
    return 'Boil Water';
  }
  if (compact === 'heat oil butter') {
    return undefined;
  }
  if (compact === 'cook vegetables' && /\brice\b/.test(lowerInstruction)) {
    return undefined;
  }
  if (!actionLabelFitsPreview(normalized)) {
    return undefined;
  }

  return normalized;
}

function toRecipeStep(step: unknown, index: number): RecipeStep | null {
  const normalizedStep = typeof step === 'string' ? { instruction: step } : step;
  if (typeof normalizedStep !== 'object' || normalizedStep === null) return null;

  const candidate = normalizedStep as Partial<RecipeStep> & {
    label?: unknown;
    step?: unknown;
    title?: unknown;
  };
  const rawInstruction = typeof candidate.instruction === 'string'
    ? candidate.instruction
    : typeof candidate.step === 'string'
      ? candidate.step
      : '';
  const instruction = normalizeInstructionText(rawInstruction);

  if (isPlaceholderInstruction(instruction)) return null;

  const parsedDuration = typeof candidate.duration === 'number'
    ? candidate.duration
    : typeof candidate.duration === 'string'
      ? parseTimerDurationSeconds(candidate.duration) ?? undefined
      : undefined;
  const safetyLevel = candidate.safetyLevel === 'critical' ||
    candidate.safetyLevel === 'important' ||
    candidate.safetyLevel === 'minor'
    ? candidate.safetyLevel
    : 'minor';

  return {
    id: index + 1,
    actionLabel: normalizeStepActionLabel(candidate.actionLabel ?? candidate.label ?? candidate.title, instruction),
    instruction,
    duration: parsedDuration,
    tips: typeof candidate.tips === 'string' ? candidate.tips : '',
    visualCues: typeof candidate.visualCues === 'string' ? candidate.visualCues : '',
    commonMistakes: typeof candidate.commonMistakes === 'string' ? candidate.commonMistakes : '',
    safetyLevel,
  };
}

function sanitizeRecipeSteps(steps: unknown): RecipeStep[] {
  if (!Array.isArray(steps)) return [];

  return steps
    .map(toRecipeStep)
    .filter((step: RecipeStep | null): step is RecipeStep => step !== null)
    .map((step, index) => ({ ...step, id: index + 1 }));
}

function splitInstructionLines(instruction: string) {
  const normalized = normalizeInstructionText(instruction);
  if (!normalized) return [];

  const sentenceMatches = normalized.match(/[^.!?]+(?:[.!?]+|$)/g) || [normalized];
  return sentenceMatches
    .map(sentence => sentence.trim().replace(/[.!?]+$/, '').trim())
    .filter(Boolean);
}

const STEP_PREVIEW_STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'for',
  'in',
  'into',
  'of',
  'on',
  'or',
  'over',
  'the',
  'to',
  'until',
  'with',
  'your',
]);

const STEP_PREVIEW_MEASUREMENT_WORDS = new Set([
  'cup',
  'cups',
  'tablespoon',
  'tablespoons',
  'tbsp',
  'teaspoon',
  'teaspoons',
  'tsp',
  'ounce',
  'ounces',
  'oz',
  'gram',
  'grams',
  'g',
  'milliliter',
  'milliliters',
  'ml',
  'pound',
  'pounds',
  'lb',
  'lbs',
  'minute',
  'minutes',
  'min',
  'mins',
  'second',
  'seconds',
  'degree',
  'degrees',
  'fahrenheit',
  'celsius',
  'inch',
  'inches',
  'cm',
]);

function isStepPreviewNoiseWord(word: string) {
  const normalized = word.toLowerCase();
  return STEP_PREVIEW_STOP_WORDS.has(normalized) ||
    STEP_PREVIEW_MEASUREMENT_WORDS.has(normalized) ||
    /^\d/.test(normalized);
}

function titleCaseStepLabel(words: string[]) {
  return words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function deriveStepActionLabel(instruction: string) {
  const normalized = normalizeInstructionText(instruction);
  const lowerInstruction = normalized.toLowerCase();

  if (/^bring\b.*\bwater\b.*\bboil\b/.test(lowerInstruction)) {
    return 'Boil Water';
  }

  if (/\bleeks?\b/.test(lowerInstruction) && /\bspinach\b/.test(lowerInstruction) && /\b(cook|stir|soft|wilt|moisture)\b/.test(lowerInstruction)) {
    return 'Cook Leek & Spinach';
  }

  if (/\bleeks?\b/.test(lowerInstruction) && /\b(trim|slice|wash|rinse|drain|prepare|prep)\b/.test(lowerInstruction)) {
    return 'Prep Leek';
  }

  if (/\badd\b.*\b(cold\s+)?(cooked\s+)?rice\b/.test(lowerInstruction)) {
    return /\bcold\b/.test(lowerInstruction) ? 'Add Cold Rice' : 'Add Rice';
  }

  if (/\b(cool|spread)\b.*\brice\b|\brice\b.*\b(cool|steam off|dry)\b/.test(lowerInstruction)) {
    return 'Cool Rice';
  }

  if (/\brice\b/.test(lowerInstruction) && /\b(season|soy sauce|taste)\b/.test(lowerInstruction)) {
    return 'Season Fried Rice';
  }

  if (/\brice\b/.test(lowerInstruction) && /\b(mix|combine|stir)\b/.test(lowerInstruction)) {
    return 'Mix Fried Rice';
  }

  if (/\brice\b/.test(lowerInstruction) && /\b(serve|garnish|finish)\b/.test(lowerInstruction)) {
    return 'Serve Fried Rice';
  }

  if (/\brice\b/.test(lowerInstruction) && /\b(cook|fry|crisp)\b/.test(lowerInstruction)) {
    return 'Fry Rice';
  }

  if (/\bpush\b.*\b(vegetables|veggies|onions?|leeks?|carrots?|peppers?|mushrooms?|spinach|greens)\b.*\b(side|aside)\b/.test(lowerInstruction)) {
    return 'Push Vegetables Aside';
  }

  if (/\beggs?\b/.test(lowerInstruction) && /\b(crack|mix|whisk|beat)\b/.test(lowerInstruction)) {
    return 'Mix Eggs';
  }

  if (/\b(vegetables|veggies|onions?|leeks?|carrots?|peppers?|mushrooms?|spinach|greens)\b/.test(lowerInstruction) && /\b(cook|saut|stir|soften|wilt)\b/.test(lowerInstruction)) {
    return 'Cook Vegetables';
  }

  const firstClause = instruction
    .replace(/^\s*step\s*\d+\s*[:.)-]?\s*/i, '')
    .split(/[.;:]/)[0]
    .trim();
  const words = firstClause
    .replace(/[^A-Za-z0-9\s'-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const compactWords = words.filter(word => !isStepPreviewNoiseWord(word));
  let previewWords = (compactWords.length >= 2 ? compactWords : words.filter(word => !/^\d/.test(word))).slice(0, 4);
  if (previewWords.length < 2) {
    previewWords = words.slice(0, 3);
  }
  const label = titleCaseStepLabel(previewWords);

  if (!label) {
    return 'Step';
  }

  if (label.length <= STEP_ACTION_LABEL_MAX_CHARS) {
    return label;
  }

  while (previewWords.length > 2) {
    previewWords = previewWords.slice(0, -1);
    const shorterLabel = titleCaseStepLabel(previewWords);
    if (shorterLabel.length <= STEP_ACTION_LABEL_MAX_CHARS) {
      return shorterLabel;
    }
  }

  return titleCaseStepLabel(previewWords) || 'Step';
}

function getStepActionLabel(step: RecipeStep, options: { ignoreProvided?: boolean } = {}) {
  return !options.ignoreProvided && step.actionLabel
    ? step.actionLabel
    : deriveStepActionLabel(step.instruction);
}

function buildStepPreviewLabels(steps: RecipeStep[]) {
  const seen = new Set<string>();

  return steps.map((step) => {
    let label = getStepActionLabel(step);
    const normalized = normalizeActionLabelForComparison(label);

    if (seen.has(normalized)) {
      const fallbackLabel = getStepActionLabel(step, { ignoreProvided: true });
      const fallbackNormalized = normalizeActionLabelForComparison(fallbackLabel);
      if (!seen.has(fallbackNormalized)) {
        label = fallbackLabel;
      }
    }

    seen.add(normalizeActionLabelForComparison(label));
    return label;
  });
}

function getStepHeadline(step: RecipeStep, displayLabel?: string) {
  const instructionLines = splitInstructionLines(step.instruction);
  if (step.actionLabel || instructionLines.length > 1 || step.instruction.length > 90) {
    return displayLabel || getStepActionLabel(step);
  }

  return step.instruction;
}

function getInitialCaptionsVisible() {
  const saved = localStorage.getItem('laica_captions_visible');
  if (saved === null) return false;

  try {
    const parsed = JSON.parse(saved);
    return typeof parsed === 'boolean' ? parsed : false;
  } catch {
    localStorage.removeItem('laica_captions_visible');
    return false;
  }
}

function normalizeContextItems(items?: string[]) {
  return (items || [])
    .map(item => item.trim())
    .filter(Boolean);
}

interface LiveCookingProps {
  selectedMeal: RecipeRecommendation;
  scheduledTime: string;
  onBackToPlanning: (options?: { preserveMealPlanningSession?: boolean }) => void;
  onCookingGuideStarted?: () => void;
  onCookingGuideStateChange?: (isActive: boolean) => void;
  onCookingComplete?: () => void;
  profileFingerprint?: string;
}

export default function LiveCooking({
  selectedMeal,
  scheduledTime,
  onBackToPlanning,
  onCookingGuideStarted,
  onCookingGuideStateChange,
  onCookingComplete,
  profileFingerprint,
}: LiveCookingProps) {
  const { user } = useAuth();
  const isGuest = isGuestUser(user);
  const cookingSessionScopeKey = useMemo(
    () => user?.id ? `${isGuest ? 'guest' : 'linked'}:${user.id}` : 'signed-out',
    [isGuest, user?.id],
  );
  const cookingSessionStorageKey = `${COOKING_SESSION_STORAGE_KEY}:${cookingSessionScopeKey}`;
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [, setVoiceProcessingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [silenceTimeout, setSilenceTimeout] = useState<NodeJS.Timeout | null>(null);
  const [shouldProcessRecording, setShouldProcessRecording] = useState(true);
  const [assistantResponse, setAssistantResponse] = useState<string>('Welcome! Let\'s start cooking your delicious meal together. I\'m here to guide you through each step.');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [timer, setTimer] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isTimerComplete, setIsTimerComplete] = useState(false);
  const [captionSize, setCaptionSize] = useState(16);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [loadedRecipeSteps, setLoadedRecipeSteps] = useState<RecipeStep[]>([]);
  const [loadedRecipeIngredients, setLoadedRecipeIngredients] = useState<Array<{ name: string; quantity?: string; forSteps?: number[] }>>([]);
  const [hasCheckedSavedSession, setHasCheckedSavedSession] = useState(false);
  const [hasStartedCookingGuide, setHasStartedCookingGuide] = useState(false);
  const [acknowledgedMissingIngredients, setAcknowledgedMissingIngredients] = useState<string[]>([]);
  const [isLoadingSteps, setIsLoadingSteps] = useState(false);
  const [stepLoadIssue, setStepLoadIssue] = useState<StepLoadIssue | null>(null);
  const [assistanceIssue, setAssistanceIssue] = useState<AssistanceIssue | null>(null);
  const [stepLoadAttempt, setStepLoadAttempt] = useState(0);
  const [useElevenLabs, setUseElevenLabs] = useState(true);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(COOKING_VOICE_SETTINGS);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [, setRecordingTimer] = useState<NodeJS.Timeout | null>(null);
  const [usageStats, setUsageStats] = useState(UsageTracker.getUsageStats());
  const [cookingSessionId, setCookingSessionId] = useState<number | null>(null);
  const [cookingStartTime, setCookingStartTime] = useState<Date | null>(null);
  const [voiceAvailable, setVoiceAvailable] = useState(true);
  const [voiceErrorShown, setVoiceErrorShown] = useState(false);
  const [stepPreviewOverflow, setStepPreviewOverflow] = useState({ left: false, right: false });
  const [audioContextInitialized, setAudioContextInitialized] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [areCaptionsVisible, setAreCaptionsVisible] = useState(getInitialCaptionsVisible);
  const wakeLockRef = useRef<ScreenWakeLockSentinel | null>(null);
  const stepPreviewStripRef = useRef<HTMLOListElement | null>(null);
  const activeStepPreviewRef = useRef<HTMLLIElement | null>(null);

  const { toast } = useToast();
  const startSessionMutation = useStartCookingSession();
  const updateSessionMutation = useUpdateCookingSession();
  const completeSessionMutation = useCompleteCookingSession();

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  const currentAudioRef = useRef<AudioBufferSourceNode | null>(null);
  const audioLifecycleActiveRef = useRef(true);
  const activeMediaStreamRef = useRef<MediaStream | null>(null);
  const recordingRunIdRef = useRef(0);
  const shouldProcessRecordingRef = useRef(true);
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const speechRetryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const speechRequestIdRef = useRef(0);
  const voiceProcessingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionRestoredRef = useRef(false);
  const sessionStepsRestoredRef = useRef(false);
  const restoredCookingSessionRef = useRef(false);
  const hasNotifiedCookingGuideStartedRef = useRef(false);
  const initialMountRef = useRef(true);
  const assistantResponseRef = useRef(assistantResponse);
  const isAudioEnabledRef = useRef(isAudioEnabled);
  const isVoiceRecordingRef = useRef(isVoiceRecording);
  const voiceAvailableRef = useRef(voiceAvailable);

  assistantResponseRef.current = assistantResponse;
  isAudioEnabledRef.current = isAudioEnabled;
  isVoiceRecordingRef.current = isVoiceRecording;
  voiceAvailableRef.current = voiceAvailable;

  const readyCheckIngredients = useMemo(
    () => normalizeContextItems(selectedMeal.ingredients),
    [selectedMeal.ingredients],
  );
  const readyCheckEquipment = useMemo(
    () => normalizeContextItems(selectedMeal.equipment),
    [selectedMeal.equipment],
  );
  const readyCheckMissingIngredients = useMemo(
    () => normalizeContextItems(selectedMeal.missingIngredients),
    [selectedMeal.missingIngredients],
  );

  useEffect(() => {
    onCookingGuideStateChange?.(hasStartedCookingGuide);

    if (hasStartedCookingGuide && !hasNotifiedCookingGuideStartedRef.current) {
      hasNotifiedCookingGuideStartedRef.current = true;
      onCookingGuideStarted?.();
    }
  }, [hasStartedCookingGuide, onCookingGuideStarted, onCookingGuideStateChange]);

  // Validate and sanitize a saved cooking session
  const validateCookingSession = (data: any): SavedCookingSession | null => {
    try {
      if (typeof data !== 'object' || data === null) return null;
      if (typeof data.recipeName !== 'string') return null;
      if (typeof data.recipeId !== 'string') return null;
      if (typeof data.currentStepIndex !== 'number') return null;
      if (typeof data.savedAt !== 'number') return null;
      const cookingSessionId = typeof data.cookingSessionId === 'number' && Number.isFinite(data.cookingSessionId)
        ? data.cookingSessionId
        : undefined;
      const cookingStartedAt = typeof data.cookingStartedAt === 'string' && !Number.isNaN(Date.parse(data.cookingStartedAt))
        ? data.cookingStartedAt
        : undefined;
      const savedProfileFingerprint = typeof data.profileFingerprint === 'string'
        ? data.profileFingerprint
        : undefined;
      const steps = Array.isArray(data.steps) ? sanitizeRecipeSteps(data.steps) : undefined;
      const ingredients = Array.isArray(data.ingredients)
        ? data.ingredients.map((ingredient: unknown): RecipeIngredient | null => {
          if (typeof ingredient !== 'object' || ingredient === null) return null;
          const candidate = ingredient as Partial<RecipeIngredient>;
          if (typeof candidate.name !== 'string' || candidate.name.trim().length === 0) return null;

          return {
            name: candidate.name,
            quantity: typeof candidate.quantity === 'string' ? candidate.quantity : undefined,
            forSteps: Array.isArray(candidate.forSteps)
              ? candidate.forSteps.filter((step: unknown): step is number => typeof step === 'number')
              : undefined,
          };
        }).filter((ingredient: RecipeIngredient | null): ingredient is RecipeIngredient => ingredient !== null)
        : undefined;
      
      return {
        recipeName: data.recipeName,
        recipeId: data.recipeId,
        currentStepIndex: steps && steps.length > 0
          ? Math.min(Math.max(0, data.currentStepIndex), steps.length - 1)
          : Math.max(0, data.currentStepIndex),
        timer: typeof data.timer === 'number' ? Math.max(0, data.timer) : 0,
        isTimerRunning: typeof data.isTimerRunning === 'boolean' ? data.isTimerRunning : false,
        savedAt: data.savedAt,
        steps,
        ingredients,
        cookingSessionId,
        cookingStartedAt,
        profileFingerprint: savedProfileFingerprint,
      };
    } catch {
      return null;
    }
  };

  // Restore cooking session on mount if recipe matches
  useEffect(() => {
    try {
      localStorage.removeItem(COOKING_SESSION_STORAGE_KEY);

      const saved = localStorage.getItem(cookingSessionStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        const session = validateCookingSession(parsed);
        
        if (!session) {
          // Only clear if truly invalid (malformed data)
          localStorage.removeItem(cookingSessionStorageKey);
          return;
        }
        
        // Only restore if session is for the same recipe and less than 4 hours old
        const isRecent = Date.now() - session.savedAt < 4 * 60 * 60 * 1000;
        const isSameRecipe = session.recipeName === selectedMeal.recipeName && session.recipeId === selectedMeal.id;
        const matchesProfile = !profileFingerprint || session.profileFingerprint === profileFingerprint;
        
        if (isRecent && isSameRecipe && matchesProfile) {
          setCurrentStepIndex(session.currentStepIndex);
          setTimer(session.timer);
          setIsTimerRunning(session.isTimerRunning);
          setCookingSessionId(session.cookingSessionId ?? null);
          setCookingStartTime(session.cookingStartedAt ? new Date(session.cookingStartedAt) : null);
          restoredCookingSessionRef.current = true;
          if (session.steps && session.steps.length > 0) {
            setLoadedRecipeSteps(session.steps);
            setLoadedRecipeIngredients(session.ingredients || []);
            setIsLoadingSteps(false);
            setHasStartedCookingGuide(true);
            sessionStepsRestoredRef.current = true;
          }
          sessionRestoredRef.current = true;
        } else if (!isRecent || !matchesProfile) {
          // Only clear if session is stale or based on old profile inputs, not if it's a different recipe
          // This preserves sessions for other recipes the user might return to
          localStorage.removeItem(cookingSessionStorageKey);
        }
        // If it's a different recipe but still recent, leave it intact
        // It will be overwritten when user starts cooking this new recipe
      }
    } catch (error) {
      console.error('Error loading saved cooking session:', error);
      localStorage.removeItem(cookingSessionStorageKey);
    } finally {
      setHasCheckedSavedSession(true);
    }
  }, [cookingSessionStorageKey, selectedMeal.recipeName, selectedMeal.id, profileFingerprint]);

  // Save cooking session whenever state changes
  useEffect(() => {
    // Skip initial mount to prevent overwriting saved sessions for other recipes
    if (initialMountRef.current) {
      initialMountRef.current = false;
      // Also skip if we just restored a session
      if (sessionRestoredRef.current) {
        sessionRestoredRef.current = false;
      }
      return;
    }
    
    // Skip if we just restored a session (for subsequent renders)
    if (sessionRestoredRef.current) {
      sessionRestoredRef.current = false;
      return;
    }
    
    const session: SavedCookingSession = {
      recipeName: selectedMeal.recipeName,
      recipeId: selectedMeal.id,
      currentStepIndex,
      timer,
      isTimerRunning,
      savedAt: Date.now(),
      steps: loadedRecipeSteps,
      ingredients: loadedRecipeIngredients,
      cookingSessionId: cookingSessionId ?? undefined,
      cookingStartedAt: cookingStartTime?.toISOString(),
      profileFingerprint,
    };
    localStorage.setItem(cookingSessionStorageKey, JSON.stringify(session));
  }, [currentStepIndex, timer, isTimerRunning, loadedRecipeSteps, loadedRecipeIngredients, cookingSessionId, cookingStartTime, selectedMeal.recipeName, selectedMeal.id, cookingSessionStorageKey, profileFingerprint]);

  // Clear cooking session when navigating back or completing
  const clearCookingSession = () => {
    localStorage.removeItem(cookingSessionStorageKey);
  };

  // Handle back to planning - clear session first
  const handleBackToPlanning = () => {
    stopCookingAudioLifecycle();
    clearCookingSession();
    onBackToPlanning({ preserveMealPlanningSession: !hasStartedCookingGuide });
  };

  // Detect mobile device and setup early AudioContext preparation
  useEffect(() => {
    const detectMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent) ||
                      ('ontouchstart' in window) ||
                      (navigator.maxTouchPoints > 0);
      setIsMobileDevice(isMobile);
      console.log('📱 Mobile device detected:', isMobile);
      
      if (isMobile) {
        console.log('📱 Mobile device detected - AudioContext will be initialized on first user interaction');
      }
    };

    detectMobile();
  }, []);

  useEffect(() => {
    // Initialize speech synthesis early, but do not generate or speak steps until the cook passes Ready Check.
    if ('speechSynthesis' in window) {
      speechSynthesisRef.current = window.speechSynthesis;
    }

    if (!hasStartedCookingGuide) {
      setIsLoadingSteps(false);
      return;
    }

    const loadRecipeSteps = async () => {
      if (sessionStepsRestoredRef.current) {
        sessionStepsRestoredRef.current = false;
        setIsLoadingSteps(false);
        return;
      }

      setIsLoadingSteps(true);
      setStepLoadIssue(null);
      setLoadedRecipeSteps([]);
      setLoadedRecipeIngredients([]);

      try {
        const response = await fetchCookingSteps(selectedMeal.recipeName, {
          ingredients: selectedMeal.ingredients,
          equipment: selectedMeal.equipment,
          description: selectedMeal.description,
          ...(acknowledgedMissingIngredients.length > 0 ? { acknowledgedMissingIngredients } : {}),
        });
        const parsedSteps = sanitizeRecipeSteps(response.steps);
        const parsedIngredients = response.recipe?.ingredients?.map((ing: { name: string; quantity?: string; forSteps?: number[] }) => ({
          name: ing.name,
          quantity: ing.quantity,
          forSteps: ing.forSteps,
        })) || [];

        if (parsedIngredients.length > 0) {
          setLoadedRecipeIngredients(parsedIngredients);
        }

        if (parsedSteps.length === 0) {
          setStepLoadIssue({
            title: 'Cooking guide needs another try',
            description: "I couldn't turn this recipe into usable cooking steps. Try again, or use a basic backup guide if you're ready to cook now.",
          });
          setIsLoadingSteps(false);
          return;
        }

        setLoadedRecipeSteps(parsedSteps);
        // Reset audio state and set initial welcome message - but only once
        setAudioJustEnabled(false);
        setLastSpokenResponse(''); // Clear last spoken to allow new message
        
        // Only set welcome message if we don't already have one to prevent duplicates
        if (assistantResponse === 'Welcome! Let\'s start cooking your delicious meal together. I\'m here to guide you through each step.') {
          const welcomeMessage = `Great! I've prepared ${parsedSteps.length} steps for cooking ${selectedMeal.recipeName}. Are you ready to begin? Let's start with step 1: ${parsedSteps[0].instruction}`;
          setAssistantResponse(welcomeMessage);
        }
        
        // Note: cooking session will be started when component mounts
      } catch (error) {
        const feedback = classifyAiRequestError(error, { context: 'cooking steps', feedbackLink: false });
        setStepLoadIssue({
          title: 'Cooking guide needs another try',
          description: feedback.description || "I couldn't prepare cooking steps right now. Try again, or use a basic backup guide if you're ready to cook now.",
        });
      }
      
      setIsLoadingSteps(false);
    };

    loadRecipeSteps();
  }, [selectedMeal.recipeName, stepLoadAttempt, hasStartedCookingGuide, acknowledgedMissingIngredients, selectedMeal.ingredients, selectedMeal.equipment, selectedMeal.description]);

  const useBasicCookingSteps = () => {
    const basicSteps = createBasicCookingSteps(selectedMeal.recipeName);

    setHasStartedCookingGuide(true);
    setStepLoadIssue(null);
    setCurrentStepIndex(0);
    setTimer(0);
    setIsTimerRunning(false);
    setLoadedRecipeIngredients((selectedMeal.ingredients || []).map(name => ({ name })));
    setLoadedRecipeSteps(basicSteps);
    setAudioJustEnabled(false);
    setLastSpokenResponse('');
    setAssistantResponse(`I made a basic backup guide for ${selectedMeal.recipeName}. Start with step 1: ${basicSteps[0].instruction}`);
  };

  // Cooking session management functions
  const startCookingSession = async (totalSteps: number, steps?: RecipeStep[], ingredients?: Array<{ name: string; quantity?: string; forSteps?: number[] }>) => {
    if (isGuest) {
      return;
    }

    try {
      const recipeSnapshot = {
        recipeName: selectedMeal.recipeName,
        description: selectedMeal.description,
        cookTime: selectedMeal.cookTime,
        difficulty: selectedMeal.difficulty,
        cuisine: selectedMeal.cuisine,
        pantryMatch: selectedMeal.pantryMatch,
        missingIngredients: selectedMeal.missingIngredients || [],
        pantryIngredientsUsed: selectedMeal.ingredients || [],
        additionalIngredientsNeeded: selectedMeal.missingIngredients || [],
        ingredients: ingredients || loadedRecipeIngredients || [],
        isFusion: 'isFusion' in selectedMeal ? Boolean(selectedMeal.isFusion) : false,
        steps: (steps || []).map(s => ({
          id: s.id,
          actionLabel: s.actionLabel,
          instruction: s.instruction,
          duration: s.duration,
          tips: s.tips,
          visualCues: s.visualCues,
          commonMistakes: s.commonMistakes,
          safetyLevel: s.safetyLevel,
        })),
      };
      const sessionData = {
        recipeName: selectedMeal.recipeName,
        recipeDescription: selectedMeal.description,
        recipeSnapshot,
        ingredientsUsed: selectedMeal.ingredients || [],
        totalSteps,
      };
      
      const session = await startSessionMutation.mutateAsync(sessionData);
      setCookingSessionId(session.id);
      setCookingStartTime(new Date());
    } catch (error) {
      console.error('Failed to start cooking session:', error);
    }
  };

  const updateCookingProgress = async (completedSteps: number) => {
    if (cookingSessionId) {
      try {
        await updateSessionMutation.mutateAsync({
          sessionId: cookingSessionId,
          updateData: { completedSteps }
        });
      } catch (error) {
        console.error('Failed to update cooking progress:', error);
      }
    }
  };

  const completeCookingSession = async () => {
    stopCookingAudioLifecycle();
    // Clear saved cooking session on completion
    clearCookingSession();
    onCookingComplete?.();

    if (isGuest) {
      toast({
        title: "Nice, dinner's ready.",
        description: "Sign up before saving cooking history.",
      });
      return;
    }
    
    if (cookingSessionId && cookingStartTime) {
      try {
        const duration = Math.floor((Date.now() - cookingStartTime.getTime()) / 1000 / 60); // in minutes
        
        await completeSessionMutation.mutateAsync({
          sessionId: cookingSessionId,
          completionData: {
            ingredientsRemaining: [], // This could be enhanced to ask user for remaining ingredients
            cookingDuration: duration,
            completedSteps: loadedRecipeSteps.length,
          }
        });
        
        toast({
          title: "Nice, dinner's ready.",
          description: "Saved to your cooking history. Pantry cleanup comes next.",
        });
      } catch (error) {
        console.error('Failed to complete cooking session:', error);
      }
    }
  };

  // Start cooking session when steps are loaded
  useEffect(() => {
    if (!isGuest && loadedRecipeSteps.length > 0 && !cookingSessionId && !restoredCookingSessionRef.current) {
      startCookingSession(loadedRecipeSteps.length, loadedRecipeSteps, loadedRecipeIngredients);
    }
  }, [isGuest, loadedRecipeSteps, loadedRecipeIngredients, cookingSessionId]);

  // Use loaded steps
  const currentRecipeSteps = loadedRecipeSteps;
  const displayedStepIndex = currentRecipeSteps.length > 0
    ? Math.min(currentStepIndex, currentRecipeSteps.length - 1)
    : currentStepIndex;
  const currentStep = currentRecipeSteps[displayedStepIndex];
  const timerDuration = getStepTimerDurationSeconds(currentStep);
  const shouldShowTimerControl = Boolean(currentStep) && timerDuration !== null;
  const displayedTimerSeconds = isTimerComplete ? 0 : timer > 0 ? timer : timerDuration ?? 0;
  const timerControlDurationLabel = timerDuration !== null ? formatTimerControlDuration(timerDuration) : '';
  const timerPrimaryActionLabel = isTimerRunning
    ? 'Pause timer'
    : isTimerComplete
      ? `Restart ${timerControlDurationLabel} timer`
      : timer > 0
        ? 'Resume timer'
        : `Start ${timerControlDurationLabel} timer`;
  const stepPreviewLabels = useMemo(
    () => buildStepPreviewLabels(currentRecipeSteps),
    [currentRecipeSteps],
  );
  const currentStepHeadline = currentStep ? getStepHeadline(currentStep, stepPreviewLabels[displayedStepIndex]) : '';
  const currentStepInstructionLines = currentStep ? splitInstructionLines(currentStep.instruction) : [];
  const shouldShowInstructionDetails = Boolean(
    currentStep && (
      currentStepHeadline !== currentStep.instruction ||
      currentStepInstructionLines.length > 1
    ),
  );
  const isFinalStep = currentRecipeSteps.length > 0 && displayedStepIndex >= currentRecipeSteps.length - 1;
  const updateStepPreviewOverflow = useCallback(() => {
    const strip = stepPreviewStripRef.current;
    if (!strip) {
      setStepPreviewOverflow({ left: false, right: false });
      return;
    }

    const maxScrollLeft = Math.max(0, strip.scrollWidth - strip.clientWidth);
    const nextOverflow = {
      left: strip.scrollLeft > 1,
      right: strip.scrollLeft < maxScrollLeft - 1,
    };

    setStepPreviewOverflow(current => (
      current.left === nextOverflow.left && current.right === nextOverflow.right
        ? current
        : nextOverflow
    ));
  }, []);
  const scrollActiveStepPreviewIntoView = useCallback((behavior: ScrollBehavior = 'smooth') => {
    activeStepPreviewRef.current?.scrollIntoView?.({
      behavior,
      block: 'nearest',
      inline: 'center',
    });

    window.requestAnimationFrame?.(updateStepPreviewOverflow);
  }, [updateStepPreviewOverflow]);

  useEffect(() => {
    if (currentRecipeSteps.length > 0 && currentStepIndex >= currentRecipeSteps.length) {
      setCurrentStepIndex(currentRecipeSteps.length - 1);
    }
  }, [currentRecipeSteps.length, currentStepIndex]);

  useEffect(() => {
    if (!hasStartedCookingGuide || currentRecipeSteps.length === 0) return;

    scrollActiveStepPreviewIntoView();
  }, [displayedStepIndex, currentRecipeSteps.length, hasStartedCookingGuide, scrollActiveStepPreviewIntoView]);

  useEffect(() => {
    const strip = stepPreviewStripRef.current;
    if (!strip || currentRecipeSteps.length === 0) return;

    updateStepPreviewOverflow();
    strip.addEventListener('scroll', updateStepPreviewOverflow, { passive: true });
    window.addEventListener('resize', updateStepPreviewOverflow);

    return () => {
      strip.removeEventListener('scroll', updateStepPreviewOverflow);
      window.removeEventListener('resize', updateStepPreviewOverflow);
    };
  }, [currentRecipeSteps.length, updateStepPreviewOverflow]);

  useEffect(() => {
    if (!hasStartedCookingGuide || currentRecipeSteps.length === 0) return;

    let cancelled = false;

    const releaseWakeLock = async () => {
      const sentinel = wakeLockRef.current;
      wakeLockRef.current = null;

      if (sentinel && !sentinel.released) {
        await sentinel.release().catch(() => undefined);
      }
    };

    const requestWakeLock = async () => {
      if (document.visibilityState !== 'visible' || wakeLockRef.current) return;

      const wakeLock = (navigator as NavigatorWithWakeLock).wakeLock;
      if (!wakeLock) return;

      try {
        const sentinel = await wakeLock.request('screen');

        if (cancelled) {
          await sentinel.release().catch(() => undefined);
          return;
        }

        wakeLockRef.current = sentinel;
        sentinel.addEventListener('release', () => {
          if (wakeLockRef.current === sentinel) {
            wakeLockRef.current = null;
          }
        });
      } catch (error) {
        console.info('Screen wake lock is unavailable for this Live Cooking session.', error);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void requestWakeLock();
      } else {
        void releaseWakeLock();
      }
    };

    void requestWakeLock();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      void releaseWakeLock();
    };
  }, [currentRecipeSteps.length, hasStartedCookingGuide]);

  // Timer effect
  useEffect(() => {
    if (isTimerRunning && timer > 0) {
      timerRef.current = setTimeout(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    } else if (timer === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      setIsTimerComplete(true);
      setSpokenAssistantResponse("Time's up! Check your cooking and let me know how it looks.");
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timer, isTimerRunning]);


  const clearSpeechTimeout = () => {
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }
  };

  const clearSpeechRetryTimeout = () => {
    if (speechRetryTimeoutRef.current) {
      clearTimeout(speechRetryTimeoutRef.current);
      speechRetryTimeoutRef.current = null;
    }
  };

  const stopSpeechAudioPlayback = () => {
    // Stop ElevenLabs audio
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.stop();
      } catch (error) {
        console.warn('Audio source was already stopped:', error);
      }
      currentAudioRef.current = null;
    }
    
    // Stop browser TTS, including queued utterances.
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    setIsSpeaking(false);
  };

  const cancelSpeechQueue = () => {
    speechRequestIdRef.current += 1;
    clearSpeechTimeout();
    clearSpeechRetryTimeout();
    stopSpeechAudioPlayback();
  };

  const beginSpeechRequest = () => {
    speechRequestIdRef.current += 1;
    clearSpeechTimeout();
    clearSpeechRetryTimeout();
    stopSpeechAudioPlayback();
    return speechRequestIdRef.current;
  };

  const canUseSpeechRequest = (requestId: number) => {
    return audioLifecycleActiveRef.current &&
      speechRequestIdRef.current === requestId &&
      isAudioEnabledRef.current &&
      !isVoiceRecordingRef.current &&
      voiceAvailableRef.current;
  };

  // Stop current and queued cooking speech.
  const stopAudio = () => {
    cancelSpeechQueue();
  };

  const clearRecordingTimers = () => {
    if (voiceProcessingTimeoutRef.current) {
      clearTimeout(voiceProcessingTimeoutRef.current);
      voiceProcessingTimeoutRef.current = null;
      setVoiceProcessingTimeout(null);
    }
    if (silenceTimeout) {
      clearTimeout(silenceTimeout);
      setSilenceTimeout(null);
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
      setRecordingTimer(null);
    }
  };

  function stopCookingAudioLifecycle() {
    audioLifecycleActiveRef.current = false;
    recordingRunIdRef.current += 1;
    shouldProcessRecordingRef.current = false;
    setShouldProcessRecording(false);

    clearSpeechTimeout();
    clearSpeechRetryTimeout();
    stopAudio();

    if (mediaRecorderRef.current?.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (error) {
        console.warn('Voice recording was already stopped:', error);
      }
    }

    activeMediaStreamRef.current?.getTracks().forEach(track => track.stop());
    activeMediaStreamRef.current = null;
    clearRecordingTimers();
    setIsVoiceRecording(false);
    setIsProcessing(false);
    setRecordingDuration(0);
  }

  // Initialize AudioContext with mobile support
  const initializeAudioContext = async () => {
    try {
      if (audioContextRef.current) {
        // Resume existing context if needed
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
          console.log('✅ AudioContext resumed from suspended state');
        }
      } else {
        // Create new AudioContext
        audioContextRef.current = new AudioContext();
        console.log(`✅ AudioContext created on ${isMobileDevice ? 'mobile' : 'desktop'} device`);
      }
      
      // Ensure context is running
      if (audioContextRef.current.state === 'running') {
        setAudioContextInitialized(true);
        // Note: Don't re-enable voice features here - only AudioContext is ready
        // Voice features will be re-enabled only when actual audio playback succeeds
        return true;
      }
      
      if (isMobileDevice) {
        console.log(`📱 Mobile AudioContext state: ${audioContextRef.current.state} - may need more user interaction`);
      }
      
      return false;
    } catch (error) {
      console.error(`❌ AudioContext initialization failed on ${isMobileDevice ? 'mobile' : 'desktop'}:`, error);
      return false;
    }
  };

  // Ensure AudioContext is ready for playback
  const ensureAudioContextReady = async () => {
    if (!audioContextRef.current || audioContextRef.current.state !== 'running') {
      const initialized = await initializeAudioContext();
      if (!initialized) {
        throw new Error('AudioContext not available');
      }
    }
    return audioContextRef.current;
  };

  // Enhanced text-to-speech using ElevenLabs with proper AudioContext management
  const speakText = async (text: string, retryCount = 0, speechRequestId?: number) => {
    if (!audioLifecycleActiveRef.current || !text) return;
    
    // Don't speak operational/system messages
    if (isOperationalMessage(text)) {
      console.log('Skipping TTS for operational message:', text);
      return;
    }

    const requestId = speechRequestId ?? beginSpeechRequest();
    if (!canUseSpeechRequest(requestId)) return;
    
    setIsSpeaking(true);
    
    try {
      // Use ElevenLabs for high-quality voice
      console.log('🎵 Synthesizing speech:', text.substring(0, 50) + '...');
      const audioBuffer = await elevenLabsClient.synthesizeSpeech(text, voiceSettings);
      if (!canUseSpeechRequest(requestId)) return;
      console.log('✅ Speech synthesis successful');
      
      // Ensure AudioContext is ready
      const audioContext = await ensureAudioContextReady();
      if (!canUseSpeechRequest(requestId)) return;
      if (!audioContext) {
        throw new Error('AudioContext not available');
      }
      console.log('🔊 AudioContext state:', audioContext.state);
      
      const audioData = await audioContext.decodeAudioData(audioBuffer);
      if (!canUseSpeechRequest(requestId)) return;
      const source = audioContext.createBufferSource();
      source.buffer = audioData;
      source.connect(audioContext.destination);
      
      currentAudioRef.current = source;
      
      source.onended = () => {
        if (speechRequestIdRef.current !== requestId || currentAudioRef.current !== source) return;
        console.log('✅ Audio playback completed');
        setIsSpeaking(false);
        currentAudioRef.current = null;
      };
      
      // Note: AudioBufferSourceNode doesn't have onerror event
      // Errors are handled by the try-catch block
      
      source.start();
      console.log('🎵 Audio playback started');
      
      // Only re-enable voice features if playback actually works
      if (!voiceAvailable) {
        setVoiceAvailable(true);
        console.log('🔊 Voice features re-enabled - audio playback confirmed working');
      }
      
    } catch (error) {
      if (!canUseSpeechRequest(requestId)) return;
      console.error('❌ Speech synthesis/playback error:', error);
      setIsSpeaking(false);
      
      // Retry logic for mobile AudioContext issues
      if (retryCount < 2 && (error as Error).message.includes('AudioContext')) {
        console.log(`🔄 Retrying audio playback (attempt ${retryCount + 1})`);
        // Reset AudioContext and try again
        audioContextRef.current = null;
        setAudioContextInitialized(false);
        speechRetryTimeoutRef.current = setTimeout(() => {
          speechRetryTimeoutRef.current = null;
          if (canUseSpeechRequest(requestId)) {
            speakText(text, retryCount + 1, requestId);
          }
        }, 100);
        return;
      }
      
      // Mark voice as unavailable and show notification
      setVoiceAvailable(false);
      
      // Show user notification only once per session
      if (!voiceErrorShown) {
        setVoiceErrorShown(true);
        const isAudioContextError = (error as Error).message.includes('AudioContext') || 
                                   (error as Error).message.includes('suspended') ||
                                   (error as Error).message.includes('not available');
        
        let title = "Voice features unavailable";
        let description = "Voice features aren't available at the moment. You may still continue your cooking session.";
        
        if (isMobileDevice && isAudioContextError) {
          title = "Mobile audio needs permission";
          description = "Tap the audio or Ask button to enable voice features. You can continue cooking with text instructions.";
        } else if (isMobileDevice) {
          description = "Voice features may need browser permission. You can continue cooking with text instructions.";
        }
        
        toast({
          title,
          description,
          variant: "destructive",
          duration: 6000
        });
      }
    }
  };

  const toggleCaptionsVisible = () => {
    setAreCaptionsVisible((prev: boolean) => {
      const newValue = !prev;
      localStorage.setItem('laica_captions_visible', JSON.stringify(newValue));
      return newValue;
    });
  };

  // Speak assistant response when it changes (only if audio is enabled and not recording)
  // Don't speak if audio was just turned back on (to avoid repeating current step)
  // Don't speak while voice recording to prevent contamination
  const [audioJustEnabled, setAudioJustEnabled] = useState(false);
  const [lastSpokenResponse, setLastSpokenResponse] = useState<string>('');
  const [speechIntentRevision, setSpeechIntentRevision] = useState(0);
  const [isInitializing, setIsInitializing] = useState(true);
  
  useEffect(() => {
    if (!hasStartedCookingGuide || isLoadingSteps) {
      cancelSpeechQueue();
      return;
    }

    if (!isAudioEnabled) {
      cancelSpeechQueue();
      return;
    }

    if (audioJustEnabled) {
      cancelSpeechQueue();
      setAudioJustEnabled(false);
      return;
    }

    if (assistantResponse && !isVoiceRecording && assistantResponse !== lastSpokenResponse) {
      const textToSpeak = assistantResponse;
      const speechRequestId = beginSpeechRequest();
      const delay = isLoadingSteps ? 1200 : 800;

      speechTimeoutRef.current = setTimeout(() => {
        speechTimeoutRef.current = null;
        if (
          canUseSpeechRequest(speechRequestId) &&
          assistantResponseRef.current === textToSpeak
        ) {
          speakText(textToSpeak, 0, speechRequestId);
          setLastSpokenResponse(textToSpeak);
        }
      }, delay);
    }
  }, [assistantResponse, isAudioEnabled, audioJustEnabled, lastSpokenResponse, isVoiceRecording, isLoadingSteps, speechIntentRevision, hasStartedCookingGuide]);

  const setSpokenAssistantResponse = (text: string) => {
    cancelSpeechQueue();
    setAssistanceIssue(null);
    setAudioJustEnabled(false);
    setLastSpokenResponse('');
    setAssistantResponse(text);
    setSpeechIntentRevision(revision => revision + 1);
  };

  const showAssistanceIssue = (issue: AssistanceIssue) => {
    setAssistanceIssue(issue);
    setAudioJustEnabled(false);
    setLastSpokenResponse('');
  };

  const showAssistanceIssueFromError = (error: unknown) => {
    const feedback = classifyAiRequestError(error, { context: 'cooking assistance', feedbackLink: false });
    showAssistanceIssue({
      title: feedback.title || "Question didn't go through",
      description: `${feedback.description} Try Ask a question again when you're ready. Your cooking guide is unchanged.`,
    });
  };

  const startCookingGuideFromReadyCheck = () => {
    setAcknowledgedMissingIngredients(readyCheckMissingIngredients);
    setCurrentStepIndex(0);
    setTimer(0);
    setIsTimerRunning(false);
    setIsTimerComplete(false);
    setStepLoadIssue(null);
    setHasStartedCookingGuide(true);
  };

  const nextStep = () => {
    if (currentStepIndex < currentRecipeSteps.length - 1) {
      const newStepIndex = currentStepIndex + 1;
      setCurrentStepIndex(newStepIndex);
      const nextStepData = currentRecipeSteps[newStepIndex];
      setTimer(0);
      setIsTimerRunning(false);
      setIsTimerComplete(false);
      
      const stepText = `Step ${newStepIndex + 1}: ${formatInstructionWithTips(nextStepData.instruction, nextStepData.tips)}`;
      setSpokenAssistantResponse(stepText);
      
      // Update cooking progress
      updateCookingProgress(newStepIndex + 1);
    } else {
      setSpokenAssistantResponse("Nice, dinner's ready. Saved to your cooking history. Pantry cleanup comes next.");
      
      completeCookingSession();
    }
  };

  const previousStep = () => {
    if (currentStepIndex > 0) {
      const newStepIndex = currentStepIndex - 1;
      setCurrentStepIndex(newStepIndex);
      const prevStepData = currentRecipeSteps[newStepIndex];
      setTimer(0);
      setIsTimerRunning(false);
      setIsTimerComplete(false);
      
      const stepText = `Back to step ${newStepIndex + 1}: ${prevStepData.instruction}`;
      setSpokenAssistantResponse(stepText);
    }
  };

  const startTimer = (durationSeconds: number) => {
    setTimer(durationSeconds);
    setIsTimerRunning(true);
    setIsTimerComplete(false);
    setSpokenAssistantResponse(`Timer set for ${formatTimerDuration(durationSeconds)}. I'll let you know when time is up!`);
  };

  const toggleTimerRunning = () => {
    if (isTimerRunning) {
      setIsTimerRunning(false);
      return;
    }

    if (timer > 0) {
      setIsTimerRunning(true);
      return;
    }

    if (timerDuration === null) {
      return;
    }

    startTimer(timerDuration);
  };

  const resetTimer = () => {
    if (timerDuration === null) {
      return;
    }

    setTimer(timerDuration);
    setIsTimerRunning(false);
    setIsTimerComplete(false);
  };

  // Clean up audio on component unmount or page navigation
  useEffect(() => {
    return () => {
      stopCookingAudioLifecycle();
    };
  }, []);

  const repeatStepInstructions = () => {
    if (!currentStep) return;
    
    const stepText = `Step ${currentStepIndex + 1}: ${formatInstructionWithTips(currentStep.instruction, currentStep.tips)}`;
    setSpokenAssistantResponse(stepText);
  };

  // Voice recording functionality with silence detection
  const startVoiceRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showAssistanceIssue({
        title: 'Voice question is not available',
        description: 'This browser does not support microphone recording here. The cooking guide is unchanged.',
      });
      return;
    }

    try {
      setAssistanceIssue(null);
      audioLifecycleActiveRef.current = true;
      const recordingRunId = recordingRunIdRef.current + 1;
      recordingRunIdRef.current = recordingRunId;
      shouldProcessRecordingRef.current = true;
      isVoiceRecordingRef.current = true;
      setShouldProcessRecording(true);

      // IMMEDIATELY stop any playing audio to prevent conflicts
      stopAudio();
      
      // Ensure AudioContext is ready for recording
      await initializeAudioContext();
      
      setIsVoiceRecording(true);
      // Don't set any assistant response to avoid audio feedback during recording
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!audioLifecycleActiveRef.current || recordingRunIdRef.current !== recordingRunId) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      activeMediaStreamRef.current = stream;
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      // Set up audio context for silence detection
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);
      
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      let silenceStart = Date.now();
      let hasDetectedSound = false;
      let isCurrentlyListening = true;
      let initialDelayComplete = false;
      let recordingStartTime = Date.now();
      const {
        silenceThreshold,
        silenceDurationMs,
        initialDelayMs,
        maxRecordingTimeMs,
        minRecordingTimeMs,
        autoStopTimeMs,
        audioLevelPollMs,
      } = VOICE_RECORDING_SILENCE_CONFIG;
      
      const checkAudioLevel = () => {
        if (!isCurrentlyListening || !audioLifecycleActiveRef.current || recordingRunIdRef.current !== recordingRunId) return;
        
        // Check if initial delay has passed
        const currentTime = Date.now();
        if (!initialDelayComplete) {
          if (currentTime - recordingStartTime < initialDelayMs) {
            setTimeout(checkAudioLevel, audioLevelPollMs);
            return;
          }
          initialDelayComplete = true;
          console.log('Initial delay complete, starting silence detection');
        }
        
        analyser.getByteTimeDomainData(dataArray);
        const volume = calculateTimeDomainVolume(dataArray);
        const recordingTime = Date.now() - recordingStartTime;
        
        console.log(`🎤 Audio level: ${volume.toFixed(2)} (threshold: ${silenceThreshold}), Recording time: ${(recordingTime/1000).toFixed(1)}s, Has detected sound: ${hasDetectedSound}, Initial delay complete: ${initialDelayComplete}`);
        
        // Extra debugging - track volume ranges
        if (initialDelayComplete) {
          if (volume > silenceThreshold) {
            console.log(`🔊 SOUND detected - Volume: ${volume.toFixed(2)} > ${silenceThreshold}`);
          } else {
            console.log(`🔇 QUIET detected - Volume: ${volume.toFixed(2)} <= ${silenceThreshold}`);
          }
        }
        
        // Check for maximum recording time limit
        if (recordingTime > maxRecordingTimeMs) {
          console.log('Auto-stopping due to maximum recording limit');
          isCurrentlyListening = false;
          if (hasDetectedSound && recordingTime > minRecordingTimeMs) {
            stopVoiceRecording();
          } else {
            cancelVoiceRecording();
          }
          return;
        }
        
        // Auto-stop after reasonable time if we've detected speech (backup silence detection)
        if (hasDetectedSound && initialDelayComplete && recordingTime > autoStopTimeMs) {
          console.log('🕒 Auto-stopping after 8 seconds with detected speech');
          isCurrentlyListening = false;
          stopVoiceRecording();
          return;
        }
        
        if (volume > silenceThreshold) {
          // Sound detected
          if (!hasDetectedSound) {
            hasDetectedSound = true;
            // Don't set any assistant response to avoid audio feedback during recording
          }
          silenceStart = Date.now();
        } else if (hasDetectedSound && initialDelayComplete) {
          // Silence detected after sound was heard and initial delay passed
          const silenceDuration = Date.now() - silenceStart;
          console.log(`🔇 SILENCE TRACKING - Duration: ${silenceDuration}ms / ${silenceDurationMs}ms needed, Volume: ${volume.toFixed(2)}`);
          
          if (silenceDuration >= silenceDurationMs) {
            console.log('Auto-processing due to silence detection');
            isCurrentlyListening = false;
            const totalRecordingTime = Date.now() - recordingStartTime;
            console.log(`Total recording time: ${totalRecordingTime}ms, minimum: ${minRecordingTimeMs}ms`);
            
            if (totalRecordingTime >= minRecordingTimeMs) {
              // Don't set assistant response to avoid audio feedback
              stopVoiceRecording();
            } else {
              console.log('Recording too short, cancelling');
              // Don't set assistant response to avoid audio feedback
              cancelVoiceRecording();
            }
            return;
          }
        }
        
        // Continue checking
        setTimeout(checkAudioLevel, audioLevelPollMs);
      };
      
      const chunks: BlobPart[] = [];
      mediaRecorderRef.current.ondataavailable = (event) => {
        chunks.push(event.data);
      };
      
      setShouldProcessRecording(true); // Reset processing flag
      shouldProcessRecordingRef.current = true;
      
      mediaRecorderRef.current.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        if (activeMediaStreamRef.current === stream) {
          activeMediaStreamRef.current = null;
        }
        audioContext.close();
        
        console.log('Recording stopped. shouldProcessRecording:', shouldProcessRecording, 'chunks.length:', chunks.length);
        
        // Check the shouldProcess flag at processing time - this prevents cancelled recordings from processing
        if (
          shouldProcessRecordingRef.current &&
          audioLifecycleActiveRef.current &&
          recordingRunIdRef.current === recordingRunId &&
          chunks.length > 0
        ) {
          setIsProcessing(true);
          setAssistantResponse("Processing your question...");
          setLastSpokenResponse(''); // Clear to allow next real response
          
          const audioBlob = new Blob(chunks, { type: 'audio/wav' });
          await processVoiceQuestion(audioBlob);
        } else {
          console.log('Recording not processed - either cancelled or no audio data');
          setIsProcessing(false);
        }
      };
      
      mediaRecorderRef.current.start();
      // Store start time for initial delay
      (mediaRecorderRef.current as any).startTime = Date.now();
      
      // Start recording duration timer
      setRecordingDuration(0);
      const durationTimer = setInterval(() => {
        setRecordingDuration(prev => prev + 0.1);
      }, 100);
      recordingTimerRef.current = durationTimer;
      setRecordingTimer(durationTimer);
      
      checkAudioLevel(); // Start silence detection
      
      // Auto-stop after 35 seconds as final safety fallback (5s buffer beyond max recording)
      const timeout = setTimeout(() => {
        console.log('Auto-stopping due to 35s safety timeout');
        isCurrentlyListening = false;
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          showAssistanceIssue({
            title: 'Question timed out',
            description: 'Try Ask a question again and keep it under 30 seconds. The cooking guide is unchanged.',
          });
          cancelVoiceRecording();
        }
      }, 35000);
      voiceProcessingTimeoutRef.current = timeout;
      setVoiceProcessingTimeout(timeout);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      showAssistanceIssue({
        title: "Microphone didn't start",
        description: 'Check your browser permission, then use Ask a question again. The cooking guide is unchanged.',
      });
      isVoiceRecordingRef.current = false;
      setIsVoiceRecording(false);
    }
  };

  const stopVoiceRecording = () => {
    console.log('Stopping voice recording');
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    clearRecordingTimers();
    isVoiceRecordingRef.current = false;
    setIsVoiceRecording(false);
  };

  const cancelVoiceRecording = () => {
    console.log('Cancelling voice recording - will NOT process');
    
    // Cancel without processing - set flag BEFORE stopping recorder
    setShouldProcessRecording(false);
    shouldProcessRecordingRef.current = false;
    recordingRunIdRef.current += 1;
    
    // Stop all recording processes
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    activeMediaStreamRef.current?.getTracks().forEach(track => track.stop());
    activeMediaStreamRef.current = null;
    clearRecordingTimers();
    
    // Reset all states
    isVoiceRecordingRef.current = false;
    setIsVoiceRecording(false);
    setIsProcessing(false);
    setRecordingDuration(0);
    
    // Clear any pending responses - no explicit message needed for natural conversation flow
    setLastSpokenResponse('');
  };

  const processVoiceQuestion = async (audioBlob: Blob) => {
    try {
      // Check usage limits before processing
      const usageLimits = UsageTracker.checkUsageLimits();
      
      if (!usageLimits.withinLimits) {
        const exceeded = usageLimits.limitsExceeded.join(', ');
        showAssistanceIssue({
          title: 'Voice questions are temporarily limited',
          description: `You've reached your ${exceeded} limit. Remaining usage: ${usageLimits.remainingUsage.dailyMinutes.toFixed(1)} min today. The cooking guide is unchanged.`,
        });
        clearRecordingTimers();
        setIsProcessing(false);
        isVoiceRecordingRef.current = false;
        setIsVoiceRecording(false);
        setRecordingDuration(0);
        return;
      }
      
      // Show warnings if approaching limits
      if (usageLimits.warnings.length > 0) {
        console.warn('Usage warnings:', usageLimits.warnings);
      }
      
      // Compress and optimize audio before sending for transcription
      console.log('Compressing audio for cost optimization...');
      const audioProcessingResult = await AudioProcessor.compressAudio(audioBlob);
      if (!audioLifecycleActiveRef.current) return;
      
      console.log('Audio compression results:', {
        originalSize: audioProcessingResult.originalSize,
        compressedSize: audioProcessingResult.compressedSize,
        compressionRatio: audioProcessingResult.compressionRatio.toFixed(2),
        duration: audioProcessingResult.duration.toFixed(2) + 's'
      });
      
      // Use compressed audio for transcription
      const formData = new FormData();
      formData.append('audio', audioProcessingResult.blob, 'recording.wav');
      
      console.log('Sending optimized audio for transcription...');
      const transcriptionResponse = await apiFetch('/api/speech/transcribe', {
        method: 'POST',
        body: formData,
      });
      if (!audioLifecycleActiveRef.current) return;
      
      if (!transcriptionResponse.ok) {
        throw new Error(`Transcription failed: ${transcriptionResponse.statusText}`);
      }
      
      const { transcription, success } = await transcriptionResponse.json();
      
      if (!success || !transcription?.trim()) {
        throw new Error('No transcription received');
      }
      
      console.log('Transcription received:', transcription);
      
      // Record usage for analytics and cost tracking
      const newUsageStats = UsageTracker.recordUsage(
        audioProcessingResult.duration, 
        audioProcessingResult.compressionRatio
      );
      
      // Update local state to reflect new usage
      setUsageStats(newUsageStats);
      
      console.log('Current usage stats:', {
        totalTranscriptions: newUsageStats.totalTranscriptions,
        dailyUsage: `${newUsageStats.dailyUsage.toFixed(2)} min`,
        totalCost: `$${newUsageStats.totalCost.toFixed(4)}`
      });
      
      // Create a detailed context for the AI about the current step and future steps
      const futureSteps = currentRecipeSteps.slice(currentStepIndex + 1, currentStepIndex + 3);
      const futureStepsText = futureSteps.length > 0 
        ? `Upcoming steps: ${futureSteps.map((step, idx) => `${idx + currentStepIndex + 2}. ${step.instruction}`).join(' ')}`
        : '';
      
      const contextualPrompt = `Current cooking step: "${currentStep?.instruction}" 
      Tips for this step: "${currentStep?.tips}"
      Visual cues: "${currentStep?.visualCues}"
      Common mistakes: "${currentStep?.commonMistakes}"
      ${futureStepsText}
      
      User question (via voice): "${transcription}"
      
      Please provide a helpful, contextual answer that relates specifically to this step and mentions how this connects to future steps when relevant. Keep the response conversational and encouraging.`;
      
      let response: string | null = null;
      try {
        response = await fetchCookingAssistance(contextualPrompt, transcription);
      } catch (error) {
        if (!audioLifecycleActiveRef.current) return;
        console.error('Cooking assistance request failed:', error);
        showAssistanceIssueFromError(error);
        clearRecordingTimers();
        setIsProcessing(false);
        isVoiceRecordingRef.current = false;
        setIsVoiceRecording(false);
        setRecordingDuration(0);
        return;
      }
      if (!audioLifecycleActiveRef.current) return;
      
      if (response) {
        setSpokenAssistantResponse(response || "I'm here to help! Can you tell me more about what you're having trouble with?");
      } else {
        showAssistanceIssue({
          title: "Question didn't get an answer",
          description: "I didn't get a useful answer back. Try Ask a question again when you're ready. The cooking guide is unchanged.",
        });
      }
      
    } catch (error) {
      if (!audioLifecycleActiveRef.current) return;
      console.error('Error processing voice question:', error);
      showAssistanceIssue({
        title: "I couldn't hear that clearly",
        description: "Try Ask a question again when you're ready. The cooking guide is unchanged.",
      });
    }
    
    if (audioLifecycleActiveRef.current) {
      clearRecordingTimers();
      setIsProcessing(false);
      isVoiceRecordingRef.current = false;
      setIsVoiceRecording(false);
      setRecordingDuration(0);
    }
  };

  const askForHelp = async () => {
    stopAudio();

    // Initialize AudioContext on user interaction (required for mobile)
    await initializeAudioContext();
    
    if (isVoiceRecording) {
      cancelVoiceRecording();
    } else {
      startVoiceRecording();
    }
  };

  const readyCheckItems = [
    {
      label: 'Ingredients nearby',
      detail: readyCheckIngredients.length > 0
        ? readyCheckIngredients.slice(0, 4).join(', ')
        : 'Use the ingredients you confirmed in planning.',
      icon: <CheckCircle className="live-cooking-ready-icon h-5 w-5" />,
    },
    {
      label: 'Equipment ready',
      detail: readyCheckEquipment.length > 0
        ? readyCheckEquipment.slice(0, 3).join(', ')
        : 'Have your usual pan, knife, board, and utensils nearby.',
      icon: <Info className="live-cooking-ready-icon h-5 w-5" />,
    },
    {
      label: 'Heat stays off until Step 1',
      detail: 'The guide will tell you when to turn on the stove, oven, or burner.',
      icon: <Clock className="live-cooking-ready-icon h-5 w-5" />,
    },
  ];

  if (!hasCheckedSavedSession || isLoadingSteps) {
    return (
      <div className="live-cooking-ui flex min-h-screen w-full items-center justify-center p-4">
        <Card className="live-cooking-loading-card w-full max-w-md p-8 text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
          <h2 className="text-xl font-semibold mb-2">
            {hasCheckedSavedSession ? 'Preparing Your Cooking Guide' : 'Checking Your Cooking Guide'}
          </h2>
          <p className="text-muted-foreground">
            {hasCheckedSavedSession
              ? `Setting up personalized step-by-step instructions for ${selectedMeal.recipeName}...`
              : 'Looking for a saved place to resume...'}
          </p>
        </Card>
      </div>
    );
  }

  if (!hasStartedCookingGuide && currentRecipeSteps.length === 0 && !stepLoadIssue) {
    return (
      <div className="live-cooking-ui live-cooking-ready-check-screen min-h-screen w-full px-4 pb-[calc(env(safe-area-inset-bottom)+7.5rem)] pt-6">
        <div className="live-cooking-screen live-cooking-ready-check-panel mx-auto flex min-h-[calc(100svh-10rem)] w-full max-w-md flex-col gap-5">
          <Button
            variant="ghost"
            onClick={handleBackToPlanning}
            className="live-cooking-back-button self-start"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Planning
          </Button>

          <header className="space-y-2">
            <p className="live-cooking-eyebrow text-sm">Live Cooking</p>
            <h1 className="live-cooking-title text-3xl leading-tight">Ready to cook?</h1>
            <p className="live-cooking-subtitle text-base">{selectedMeal.recipeName}</p>
          </header>

          {readyCheckMissingIngredients.length > 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Laica will adapt around {readyCheckMissingIngredients.join(', ')} using what you have.
              </AlertDescription>
            </Alert>
          )}

          <div className="live-cooking-ready-list space-y-3">
            {readyCheckItems.map((item) => (
              <div key={item.label} className="live-cooking-ready-row flex items-start gap-3 p-4">
                <div className="mt-0.5">{item.icon}</div>
                <div className="min-w-0 space-y-1">
                  <p className="font-extrabold leading-none">{item.label}</p>
                  <p className="live-cooking-detail-text text-sm leading-5">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="live-cooking-ready-actions mt-auto grid gap-3 pb-2">
            <Button
              size="lg"
              onClick={() => startCookingGuideFromReadyCheck()}
              className="live-cooking-start-button h-14 text-lg font-extrabold"
            >
              <Play className="h-4 w-4 mr-2" />
              Start cooking
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (stepLoadIssue && currentRecipeSteps.length === 0) {
    return (
      <div className="live-cooking-ui flex min-h-screen w-full items-center justify-center p-4">
        <Card className="live-cooking-recovery-card w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-accent" />
              {stepLoadIssue.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{stepLoadIssue.description}</p>
            <Alert className="border-primary/20 bg-primary/10">
              <Info className="h-4 w-4" />
              <AlertDescription>
                The backup guide is intentionally generic. Use it only if you can cook safely from the recipe details you already reviewed.
              </AlertDescription>
            </Alert>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button
                onClick={() => setStepLoadAttempt(attempt => attempt + 1)}
              >
                Try again
              </Button>
              <Button
                onClick={useBasicCookingSteps}
                variant="outline"
              >
                Use basic steps
              </Button>
            </div>
            <Button
              variant="ghost"
              onClick={handleBackToPlanning}
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Planning
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="live-cooking-ui min-h-screen">
      <div className="live-cooking-screen mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-3 px-4 pb-0 pt-3 sm:pt-4">
        <header className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            onClick={handleBackToPlanning}
            className="live-cooking-back-button h-9 shrink-0 px-2 text-sm"
            aria-label="Back to Planning"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Planning
          </Button>

          <div className="min-w-0 text-center">
            <h1 className="truncate text-lg font-semibold">{selectedMeal.recipeName}</h1>
            <p className="live-cooking-eyebrow text-xs">Live Cooking</p>
          </div>

          <div className="w-10 shrink-0" aria-hidden="true" />
        </header>

        {(isProcessing || isAnalyzing) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[hsl(var(--cooking-cream-deep)/0.82)] backdrop-blur-sm">
            <div className="live-cooking-overlay-card rounded-lg px-8 py-6 text-center">
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
              <p className="text-sm font-medium">
                {isProcessing ? 'Processing your question...' : 'Analyzing cooking progress...'}
              </p>
            </div>
          </div>
        )}

        {currentStep && (
          <Card
            className="live-cooking-step-card sticky top-2 z-20 backdrop-blur"
            data-testid="current-step-panel"
          >
            <CardHeader className="space-y-2 p-3 sm:p-4">
              <div className="min-w-0 space-y-1">
                <p className="live-cooking-step-count text-xs uppercase">
                  Step {displayedStepIndex + 1} of {currentRecipeSteps.length}
                </p>
                <h2 className="live-cooking-step-headline text-xl leading-6">
                  {currentStepHeadline}
                </h2>
                {shouldShowInstructionDetails && (
                  <ol
                    aria-label="Step details"
                    className="space-y-1.5 text-sm leading-5"
                  >
                    {currentStepInstructionLines.map((line, index) => (
                      <li key={`${index}-${line}`} className="flex gap-2">
                        {currentStepInstructionLines.length > 1 && (
                          <span className="live-cooking-detail-number mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-bold">
                            {index + 1}
                          </span>
                        )}
                        <span>{line}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              <div className="relative">
                {stepPreviewOverflow.left && (
                  <button
                    type="button"
                    aria-label="Return to current step preview; more steps are to the left"
                    className="absolute bottom-0 left-1 z-10 flex h-8 w-8 items-center justify-center rounded-full border bg-white/95 text-slate-700 shadow-sm"
                    data-testid="step-preview-overflow-left"
                    onClick={() => scrollActiveStepPreviewIntoView()}
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
                {stepPreviewOverflow.right && (
                  <button
                    type="button"
                    aria-label="Return to current step preview; more steps are to the right"
                    className="absolute bottom-0 right-1 z-10 flex h-8 w-8 items-center justify-center rounded-full border bg-white/95 text-slate-700 shadow-sm"
                    data-testid="step-preview-overflow-right"
                    onClick={() => scrollActiveStepPreviewIntoView()}
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
                <ol
                  ref={stepPreviewStripRef}
                  aria-label="Step previews"
                  className="flex gap-2 overflow-x-auto pb-3"
                  data-testid="step-preview-strip"
                >
                  {stepPreviewLabels.map((label, index) => {
                    const isActive = index === displayedStepIndex;

                    return (
                      <li
                        key={`${currentRecipeSteps[index]?.id ?? index}-${label}`}
                        ref={element => {
                          if (isActive) {
                            activeStepPreviewRef.current = element;
                          }
                        }}
                        aria-current={isActive ? 'step' : undefined}
                        className="live-cooking-preview-card flex flex-1 flex-col items-center gap-1 rounded-md border px-2 py-1 text-center"
                        data-state={isActive ? 'active' : index < displayedStepIndex ? 'done' : 'upcoming'}
                      >
                        <span
                          className="live-cooking-preview-dot h-2.5 w-2.5 rounded-full"
                          aria-hidden="true"
                        />
                        <span className="line-clamp-2 text-[0.68rem] font-semibold leading-tight">
                          {label}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 p-3 pt-0 sm:p-4 sm:pt-0">
              {shouldShowTimerControl && (
                <div
                  className="live-cooking-timer-pill grid grid-cols-[4.75rem_minmax(0,1fr)_4.75rem] items-center gap-1.5 rounded-md border px-3 py-2 sm:grid-cols-[5.5rem_minmax(0,1fr)_5.5rem] sm:gap-2"
                  data-state={isTimerComplete ? 'complete' : timer > 0 ? 'active' : 'ready'}
                  data-testid="live-cooking-timer"
                >
                  <div aria-hidden="true" />
                  <div
                    className="flex min-w-0 items-center justify-center text-xl font-medium leading-none tabular-nums sm:text-3xl"
                    data-testid="live-cooking-timer-clock"
                  >
                    {isTimerComplete ? (
                      <>
                        <CheckCircle className="mr-1.5 inline h-6 w-6 shrink-0 sm:h-8 sm:w-8" />
                        <span data-testid="live-cooking-timer-status">Time's up</span>
                      </>
                    ) : (
                      <>
                        <Clock className="mr-1.5 inline h-6 w-6 shrink-0 sm:h-8 sm:w-8" />
                        {formatTimerClock(displayedTimerSeconds)}
                      </>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center justify-end gap-1 sm:gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={toggleTimerRunning}
                      aria-label={timerPrimaryActionLabel}
                      title={timerPrimaryActionLabel}
                      className="live-cooking-round-control h-9 w-9 sm:h-10 sm:w-10"
                    >
                      {isTimerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={resetTimer}
                      aria-label={`Reset ${timerControlDurationLabel} timer`}
                      title={`Reset ${timerControlDurationLabel} timer`}
                      className="live-cooking-round-control h-9 w-9 sm:h-10 sm:w-10"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={previousStep}
            disabled={currentStepIndex === 0}
            variant="outline"
          >
            <SkipBack className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button
            onClick={nextStep}
            disabled={currentRecipeSteps.length === 0}
          >
            {isFinalStep ? 'Finish' : 'Next'}
            {!isFinalStep && <SkipForward className="h-4 w-4 ml-1" />}
          </Button>
        </div>

        <section
          aria-label="Step guidance"
          className="live-cooking-guidance-panel space-y-2 rounded-lg p-3"
          data-testid="step-guidance-panel"
        >
          <div className="grid gap-2 sm:grid-cols-3">
            {currentStep?.visualCues && (
              <div className="live-cooking-cue-card p-2" data-tone="look">
                <div className="live-cooking-cue-label mb-1 flex items-center gap-1.5 text-sm font-extrabold">
                  <Info className="h-3.5 w-3.5 text-primary" />
                  Look for
                </div>
                <p className="text-sm leading-5">{currentStep.visualCues}</p>
              </div>
            )}

            {currentStep?.tips && (
              <div className="live-cooking-cue-card p-2" data-tone="tip">
                <div className="live-cooking-cue-label mb-1 flex items-center gap-1.5 text-sm font-extrabold">
                  <CheckCircle className="h-3.5 w-3.5 text-secondary" />
                  Pro tip
                </div>
                <p className="text-sm leading-5">{currentStep.tips}</p>
              </div>
            )}

            {currentStep?.commonMistakes && (
              <div className="live-cooking-cue-card p-2" data-tone="avoid">
                <div className="live-cooking-cue-label mb-1 flex items-center gap-1.5 text-sm font-extrabold">
                  <AlertTriangle className="h-3.5 w-3.5 text-foreground" />
                  Avoid
                </div>
                <p className="text-sm leading-5">{currentStep.commonMistakes}</p>
              </div>
            )}
          </div>

          <div className="live-cooking-caption-row flex items-start justify-end gap-2">
            {areCaptionsVisible && (
              <div
                className="live-cooking-caption-box min-w-0 flex-1 rounded-md border p-3"
                data-testid="transcription-box"
              >
                <p
                  className="leading-relaxed text-foreground"
                  style={{ fontSize: `${captionSize}px` }}
                  data-testid="text-transcription-full"
                >
                  {assistantResponse}
                </p>
              </div>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={toggleCaptionsVisible}
              aria-expanded={areCaptionsVisible}
              aria-label={areCaptionsVisible ? 'Hide captions' : 'Show captions'}
              title={areCaptionsVisible ? 'Hide captions' : 'Show captions'}
              className="live-cooking-caption-toggle"
              data-testid="button-toggle-captions"
            >
              <span className="live-cooking-caption-mark" aria-hidden="true">CC</span>
            </Button>
          </div>

          {!areCaptionsVisible && (
            <p className="sr-only" data-testid="text-transcription-full">
              {assistantResponse}
            </p>
          )}
        </section>

        {assistanceIssue && (
          <section
            aria-label="Voice help status"
            className="live-cooking-assistance-status flex items-start gap-2 p-3"
            data-testid="assistance-status-issue"
            role="alert"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-extrabold leading-5">{assistanceIssue.title}</p>
              <p className="text-sm leading-5">{assistanceIssue.description}</p>
            </div>
          </section>
        )}

        <div className="live-cooking-command-bar sticky bottom-0 z-30 -mx-4 mt-auto px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-2 backdrop-blur">
          <div className="grid grid-cols-[1fr_1.4fr_1fr] gap-2">
            <Button
              onClick={repeatStepInstructions}
              variant="outline"
              className="min-h-[4.25rem] min-w-0 flex-col gap-1 px-2 py-2"
              aria-label="Repeat step instruction"
            >
              <Repeat className="h-5 w-5" />
              <span className="text-sm leading-tight">Repeat</span>
            </Button>

            <Button
              variant={isVoiceRecording ? "destructive" : "default"}
              onClick={askForHelp}
              disabled={isProcessing && !isVoiceRecording}
              className="min-h-[4.25rem] min-w-0 flex-col gap-1 px-2 py-2"
              aria-label={isVoiceRecording ? "Cancel question" : "Ask a question"}
            >
              {isProcessing && !isVoiceRecording ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-current"></div>
                  <span className="text-sm leading-tight">Processing</span>
                </>
              ) : isVoiceRecording ? (
                <>
                  <MicOff className="h-5 w-5" />
                  <span className="text-sm leading-tight">Cancel</span>
                </>
              ) : (
                <>
                  <Mic className="h-5 w-5" />
                  <span className="text-center text-sm leading-tight">Ask a question</span>
                </>
              )}
            </Button>

            <Button
              onClick={async () => {
                if (!voiceAvailable) return;

                if (isAudioEnabled) {
                  stopAudio();
                  isAudioEnabledRef.current = false;
                  setAudioJustEnabled(false);
                  setIsAudioEnabled(false);
                } else {
                  cancelSpeechQueue();
                  isAudioEnabledRef.current = true;
                  setAudioJustEnabled(true);
                  setLastSpokenResponse(assistantResponseRef.current);
                  setIsAudioEnabled(true);
                  await initializeAudioContext();
                }
              }}
              disabled={!voiceAvailable}
              variant={!voiceAvailable ? "secondary" : isAudioEnabled ? "secondary" : "destructive"}
              className="min-h-[4.25rem] min-w-0 flex-col gap-1 px-2 py-2"
              aria-label={!voiceAvailable ? "Voice mode unavailable" : isAudioEnabled ? "Mute audio" : "Turn audio on"}
            >
              {!voiceAvailable ? (
                <>
                  <VolumeX className="h-5 w-5" />
                  <span className="text-sm leading-tight">Voice</span>
                </>
              ) : isAudioEnabled ? (
                <>
                  <Volume2 className="h-5 w-5" />
                  <span className="text-sm leading-tight">Audio</span>
                </>
              ) : (
                <>
                  <VolumeX className="h-5 w-5" />
                  <span className="text-sm leading-tight">Muted</span>
                </>
              )}
            </Button>
          </div>

          {isVoiceRecording && (
            <div className="mt-2 text-center">
              <div className="inline-flex items-center gap-1 rounded-full bg-destructive px-2 py-1 text-sm text-destructive-foreground">
                <div className="h-2 w-2 animate-pulse rounded-full bg-destructive-foreground"></div>
                Listening...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
