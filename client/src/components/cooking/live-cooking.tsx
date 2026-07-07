import { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Mic, MicOff, Play, Pause, SkipForward, SkipBack, AlertTriangle, Info, CheckCircle, ExternalLink, Volume2, VolumeX, Clock, ArrowLeft, MessageCircle, Repeat, StopCircle, Pin, PinOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { fetchCookingSteps, fetchCookingAssistance } from '@/lib/openai';
import { apiFetch } from '@/lib/queryClient';
import { classifyAiRequestError, withAiErrorHandling } from '@/lib/rateLimitHandler';
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

interface StepLoadIssue {
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
      instruction: `Prepare ingredients for ${recipeName}`,
      tips: 'Gather all ingredients and prep workspace',
      visualCues: 'All ingredients should be within reach',
      commonMistakes: 'Not having everything ready before starting',
      safetyLevel: 'important',
    },
    {
      id: 2,
      instruction: `Begin cooking ${recipeName}`,
      tips: 'Follow the recipe step by step',
      visualCues: 'Start with the base ingredients',
      commonMistakes: 'Rushing the cooking process',
      safetyLevel: 'important',
    },
  ];
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

function toRecipeStep(step: unknown, index: number): RecipeStep | null {
  const normalizedStep = typeof step === 'string' ? { instruction: step } : step;
  if (typeof normalizedStep !== 'object' || normalizedStep === null) return null;

  const candidate = normalizedStep as Partial<RecipeStep> & { step?: unknown };
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
      ? Number.parseInt(candidate.duration, 10) || undefined
      : undefined;
  const safetyLevel = candidate.safetyLevel === 'critical' ||
    candidate.safetyLevel === 'important' ||
    candidate.safetyLevel === 'minor'
    ? candidate.safetyLevel
    : 'minor';

  return {
    id: index + 1,
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

function getInitialTranscriptionPinned() {
  const saved = localStorage.getItem('laica_transcription_pinned');
  if (saved === null) return true;

  try {
    const parsed = JSON.parse(saved);
    return typeof parsed === 'boolean' ? parsed : true;
  } catch {
    localStorage.removeItem('laica_transcription_pinned');
    return true;
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
  onBackToPlanning: () => void;
  onCookingComplete?: () => void;
  profileFingerprint?: string;
}

export default function LiveCooking({
  selectedMeal,
  scheduledTime,
  onBackToPlanning,
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
  const [captionSize, setCaptionSize] = useState(16);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [loadedRecipeSteps, setLoadedRecipeSteps] = useState<RecipeStep[]>([]);
  const [loadedRecipeIngredients, setLoadedRecipeIngredients] = useState<Array<{ name: string; quantity?: string; forSteps?: number[] }>>([]);
  const [hasCheckedSavedSession, setHasCheckedSavedSession] = useState(false);
  const [hasStartedCookingGuide, setHasStartedCookingGuide] = useState(false);
  const [acknowledgedMissingIngredients, setAcknowledgedMissingIngredients] = useState<string[]>([]);
  const [isLoadingSteps, setIsLoadingSteps] = useState(false);
  const [stepLoadIssue, setStepLoadIssue] = useState<StepLoadIssue | null>(null);
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
  const [audioContextInitialized, setAudioContextInitialized] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [isTranscriptionPinned, setIsTranscriptionPinned] = useState(getInitialTranscriptionPinned);
  const transcriptionRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);

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
    onBackToPlanning();
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
  const progress = currentRecipeSteps.length > 0 ? ((displayedStepIndex + 1) / currentRecipeSteps.length) * 100 : 0;
  const isFinalStep = currentRecipeSteps.length > 0 && displayedStepIndex >= currentRecipeSteps.length - 1;

  useEffect(() => {
    if (currentRecipeSteps.length > 0 && currentStepIndex >= currentRecipeSteps.length) {
      setCurrentStepIndex(currentRecipeSteps.length - 1);
    }
  }, [currentRecipeSteps.length, currentStepIndex]);

  // Timer effect
  useEffect(() => {
    if (isTimerRunning && timer > 0) {
      timerRef.current = setTimeout(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    } else if (timer === 0 && isTimerRunning) {
      setIsTimerRunning(false);
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
          description = "Tap the audio button or 'Ask for Help' to enable voice features. You can continue cooking with text instructions.";
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

  // Toggle transcription pinned state and persist to localStorage
  const toggleTranscriptionPinned = () => {
    setIsTranscriptionPinned((prev: boolean) => {
      const newValue = !prev;
      localStorage.setItem('laica_transcription_pinned', JSON.stringify(newValue));
      return newValue;
    });
  };

  // Handle swipe gestures for transcription box
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchEndY - touchStartY.current;
    const swipeThreshold = 50; // pixels

    if (Math.abs(deltaY) > swipeThreshold) {
      if (deltaY > 0 && isTranscriptionPinned) {
        // Swiped down - unpin (minimize)
        toggleTranscriptionPinned();
      } else if (deltaY < 0 && !isTranscriptionPinned) {
        // Swiped up - pin (expand)
        toggleTranscriptionPinned();
      }
    }
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
    setAudioJustEnabled(false);
    setLastSpokenResponse('');
    setAssistantResponse(text);
    setSpeechIntentRevision(revision => revision + 1);
  };

  const startCookingGuideFromReadyCheck = (options?: { silent?: boolean }) => {
    setAcknowledgedMissingIngredients(readyCheckMissingIngredients);
    setCurrentStepIndex(0);
    setTimer(0);
    setIsTimerRunning(false);
    setStepLoadIssue(null);

    if (options?.silent) {
      stopAudio();
      isAudioEnabledRef.current = false;
      setAudioJustEnabled(false);
      setLastSpokenResponse(assistantResponseRef.current);
      setIsAudioEnabled(false);
    }

    setHasStartedCookingGuide(true);
  };

  const nextStep = () => {
    if (currentStepIndex < currentRecipeSteps.length - 1) {
      const newStepIndex = currentStepIndex + 1;
      setCurrentStepIndex(newStepIndex);
      const nextStepData = currentRecipeSteps[newStepIndex];
      setTimer(nextStepData?.duration || 0);
      setIsTimerRunning(false);
      
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
      setTimer(prevStepData?.duration || 0);
      setIsTimerRunning(false);
      
      const stepText = `Back to step ${newStepIndex + 1}: ${prevStepData.instruction}`;
      setSpokenAssistantResponse(stepText);
    }
  };

  const startTimer = (minutes: number) => {
    setTimer(minutes * 60);
    setIsTimerRunning(true);
    setSpokenAssistantResponse(`Timer set for ${minutes} minutes. I'll let you know when time is up!`);
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
      setAssistantResponse("Voice recording is not supported in this browser. Please use a modern browser with microphone access.");
      return;
    }

    try {
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
          setAssistantResponse("Recording timed out. Please try asking your question again, keeping it under 30 seconds.");
          cancelVoiceRecording();
        }
      }, 35000);
      voiceProcessingTimeoutRef.current = timeout;
      setVoiceProcessingTimeout(timeout);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setAssistantResponse("I couldn't access your microphone. Please check your browser permissions and try again.");
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
        setAssistantResponse(`Voice questions are temporarily limited. You've reached your ${exceeded} limit. Remaining usage: ${usageLimits.remainingUsage.dailyMinutes.toFixed(1)} min today.`);
        setIsProcessing(false);
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
      
      const response = await withAiErrorHandling(async () => {
        return await fetchCookingAssistance(contextualPrompt, transcription);
      }, { context: 'cooking assistance', feedbackLink: false });
      if (!audioLifecycleActiveRef.current) return;
      
      if (response) {
        setSpokenAssistantResponse(response || "I'm here to help! Can you tell me more about what you're having trouble with?");
      } else {
        setSpokenAssistantResponse("I'm having trouble connecting right now, but let me give you a general tip: take your time with this step and follow the visual cues I mentioned.");
      }
      
    } catch (error) {
      if (!audioLifecycleActiveRef.current) return;
      console.error('Error processing voice question:', error);
      setSpokenAssistantResponse("I didn't catch that. Could you try again?");
    }
    
    if (audioLifecycleActiveRef.current) {
      setIsProcessing(false);
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


  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSafetyColor = (level: 'critical' | 'important' | 'minor') => {
    switch (level) {
      case 'critical': return 'border-destructive/40 bg-destructive/10 text-destructive';
      case 'important': return 'border-accent/50 bg-accent/30 text-foreground';
      case 'minor': return 'border-secondary/40 bg-secondary/10 text-foreground';
    }
  };

  const getSafetyIcon = (level: 'critical' | 'important' | 'minor') => {
    switch (level) {
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      case 'important': return <Info className="h-4 w-4" />;
      case 'minor': return <CheckCircle className="h-4 w-4" />;
    }
  };

  const readyCheckItems = [
    {
      label: 'Ingredients nearby',
      detail: readyCheckIngredients.length > 0
        ? readyCheckIngredients.slice(0, 4).join(', ')
        : 'Use the ingredients you confirmed in planning.',
      icon: <CheckCircle className="h-5 w-5 text-primary" />,
    },
    {
      label: 'Equipment ready',
      detail: readyCheckEquipment.length > 0
        ? readyCheckEquipment.slice(0, 3).join(', ')
        : 'Have your usual pan, knife, board, and utensils nearby.',
      icon: <Info className="h-5 w-5 text-primary" />,
    },
    {
      label: 'Audio choice',
      detail: 'Start with spoken guidance, or cook silently and read each step.',
      icon: <Volume2 className="h-5 w-5 text-primary" />,
    },
    {
      label: 'Heat stays off until Step 1',
      detail: 'The guide will tell you when to turn on the stove, oven, or burner.',
      icon: <Clock className="h-5 w-5 text-primary" />,
    },
  ];

  if (!hasCheckedSavedSession || isLoadingSteps) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background p-4 text-foreground">
        <Card className="w-full max-w-md p-8 text-center">
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
    const primaryReadyLabel = readyCheckMissingIngredients.length > 0 ? 'Cook anyway' : 'Start cooking';

    return (
      <div className="w-full max-w-4xl mx-auto min-h-screen bg-background px-4 py-6 text-foreground">
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-md flex-col gap-5">
          <Button
            variant="ghost"
            onClick={handleBackToPlanning}
            className="self-start"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Planning
          </Button>

          <header className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Live Cooking</p>
            <h1 className="text-3xl font-semibold leading-tight">Ready to cook?</h1>
            <p className="text-base text-muted-foreground">{selectedMeal.recipeName}</p>
          </header>

          {readyCheckMissingIngredients.length > 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Skipping {readyCheckMissingIngredients.join(', ')}. Laica will adapt the guide around what you have.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            {readyCheckItems.map((item) => (
              <div key={item.label} className="flex items-start gap-3 rounded-md border bg-card p-4">
                <div className="mt-0.5">{item.icon}</div>
                <div className="min-w-0 space-y-1">
                  <p className="font-medium leading-none">{item.label}</p>
                  <p className="text-sm leading-5 text-muted-foreground">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-auto grid gap-3 pb-2">
            <Button size="lg" onClick={() => startCookingGuideFromReadyCheck()}>
              <Play className="h-4 w-4 mr-2" />
              {primaryReadyLabel}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => startCookingGuideFromReadyCheck({ silent: true })}
            >
              <VolumeX className="h-4 w-4 mr-2" />
              Cook silently
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (stepLoadIssue && currentRecipeSteps.length === 0) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background p-4 text-foreground">
        <Card className="w-full max-w-md">
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
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-4 sm:py-6">
        <header className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={handleBackToPlanning}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Planning
          </Button>

          <div className="min-w-0 text-center">
            <h1 className="truncate text-lg font-semibold">{selectedMeal.recipeName}</h1>
            <p className="text-xs text-muted-foreground">Live Cooking Assistant</p>
          </div>

          <div className="w-10 shrink-0" aria-hidden="true" />
        </header>

        {(isProcessing || isAnalyzing) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="rounded-lg border bg-card px-8 py-6 text-center shadow-lg">
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
              <p className="text-sm font-medium">
                {isProcessing ? 'Processing your question...' : 'Analyzing cooking progress...'}
              </p>
            </div>
          </div>
        )}

        {currentStep && (
          <Card
            className="sticky top-3 z-20 border-primary/20 bg-card/95 shadow-lg backdrop-blur"
            data-testid="current-step-panel"
          >
            <CardHeader className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Current step
                  </p>
                  <CardTitle className="text-xl">
                    Step {displayedStepIndex + 1} of {currentRecipeSteps.length}
                  </CardTitle>
                </div>
                <Badge className={getSafetyColor(currentStep.safetyLevel)}>
                  {getSafetyIcon(currentStep.safetyLevel)}
                  <span className="ml-1 capitalize">{currentStep.safetyLevel}</span>
                </Badge>
              </div>
              <Progress value={progress} className="w-full" />
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xl font-semibold leading-7">{currentStep.instruction}</p>

              {currentStep.duration && (
                <div className="rounded-md border bg-muted/40 p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="font-medium">
                      <Clock className="h-4 w-4 inline mr-1" />
                      Timer: {formatTime(timer)}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => setIsTimerRunning(!isTimerRunning)}
                      variant={isTimerRunning ? "destructive" : "default"}
                      aria-label={isTimerRunning ? "Pause timer" : "Resume timer"}
                    >
                      {isTimerRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => startTimer(currentStep.duration! / 60)}
                    className="w-full"
                  >
                    Start {currentStep.duration / 60} min timer
                  </Button>
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
          aria-labelledby="coach-feed-title"
          className="space-y-4 rounded-lg border bg-card p-4 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <div className="rounded-md bg-primary/10 p-2 text-primary">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 id="coach-feed-title" className="text-lg font-semibold">Coach Feed</h2>
              <p className="text-sm text-muted-foreground">
                Cues, reminders, and spoken guidance for this step.
              </p>
            </div>
          </div>

          {currentStep?.visualCues && (
            <div className="rounded-md border border-primary/20 bg-primary/10 p-3">
              <div className="mb-1 flex items-center gap-2 font-medium">
                <Info className="h-4 w-4 text-primary" />
                Look for
              </div>
              <p className="text-sm leading-5">{currentStep.visualCues}</p>
            </div>
          )}

          {currentStep?.tips && (
            <div className="rounded-md border border-secondary/20 bg-secondary/10 p-3">
              <div className="mb-1 flex items-center gap-2 font-medium">
                <CheckCircle className="h-4 w-4 text-secondary" />
                Pro tip
              </div>
              <p className="text-sm leading-5">{currentStep.tips}</p>
            </div>
          )}

          {currentStep?.commonMistakes && (
            <div className="rounded-md border border-accent/40 bg-accent/20 p-3">
              <div className="mb-1 flex items-center gap-2 font-medium">
                <AlertTriangle className="h-4 w-4 text-foreground" />
                Avoid
              </div>
              <p className="text-sm leading-5">{currentStep.commonMistakes}</p>
            </div>
          )}

          <div className="grid gap-2 sm:grid-cols-3">
            <Button
              onClick={repeatStepInstructions}
              variant="outline"
              className="w-full"
            >
              <Repeat className="h-4 w-4 mr-2" />
              Repeat Step
            </Button>

            <div className="w-full">
              <Button
                variant={isVoiceRecording ? "destructive" : "default"}
                onClick={askForHelp}
                disabled={isProcessing && !isVoiceRecording}
                className="w-full"
              >
                {isProcessing && !isVoiceRecording ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Processing...
                  </>
                ) : isVoiceRecording ? (
                  <>
                    <MicOff className="h-4 w-4 mr-2" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 mr-2" />
                    Ask for Help
                  </>
                )}
              </Button>

              {isVoiceRecording && (
                <div className="mt-2 text-center">
                  <div className="inline-flex items-center gap-1 rounded-full bg-destructive px-2 py-1 text-sm text-destructive-foreground">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-destructive-foreground"></div>
                    Listening...
                  </div>
                </div>
              )}
            </div>

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
              className="w-full"
              size="lg"
            >
              {!voiceAvailable ? (
                <>
                  <VolumeX className="h-4 w-4 mr-2" />
                  Voice mode unavailable
                </>
              ) : isAudioEnabled ? (
                <>
                  <Volume2 className="h-4 w-4 mr-2" />
                  Audio On
                </>
              ) : (
                <>
                  <VolumeX className="h-4 w-4 mr-2" />
                  Muted
                </>
              )}
            </Button>
          </div>

          <div
            ref={transcriptionRef}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className={`relative rounded-md border bg-background p-4 transition-all duration-300 ease-in-out ${
              isTranscriptionPinned ? 'sticky bottom-4 shadow-lg' : ''
            }`}
            data-testid="transcription-box"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleTranscriptionPinned();
              }}
              className="absolute top-2 right-2 z-10 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={isTranscriptionPinned ? "Unpin transcription" : "Pin transcription"}
              data-testid="button-toggle-pin"
            >
              {isTranscriptionPinned ? (
                <Pin className="h-4 w-4" />
              ) : (
                <PinOff className="h-4 w-4" />
              )}
            </button>

            <div className="pr-10">
              <p
                className="leading-relaxed text-foreground"
                style={{ fontSize: `${captionSize}px` }}
                data-testid="text-transcription-full"
              >
                {assistantResponse}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
