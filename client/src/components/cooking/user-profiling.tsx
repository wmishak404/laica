import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { InventoryReviewChip } from '@/components/cooking/inventory-review-chip';
import { Input } from '@/components/ui/input';
import { NativeCamera } from '@/components/ui/native-camera';
import { ToastAction } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import { processWithBoundedConcurrency } from '@/lib/boundedConcurrency';
import {
  clearInventoryReviewType,
  createInventoryReviewState,
  getInventoryReviewChipState,
  markInventoryReviewEntries,
  pruneInventoryReviewType,
  removeInventoryReviewEntries,
} from '@/lib/inventoryReviewState';
import {
  correctPantryManualEntries,
  mergeUniqueEntries,
  mergeUniqueEntriesWithMetadata,
  normalizeEntryDuplicateKey,
  parseCommaSeparatedEntries,
  type PantryManualEntryCorrection,
} from '@/lib/entryParsing';
import { analyzeImage } from '@/lib/openai';
import {
  ArrowLeft,
  Check,
  ChefHat,
  CookingPot,
  ImagePlus,
  Loader2,
  Package,
  ScanLine,
  ShieldCheck,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react';
import {
  extractVisionLabels,
  getVisionRejectionFeedback,
  isRejectedVisionResult,
  type VisionAnalysisResult,
} from '@/lib/visionResult';
import {
  SCAN_ANALYSIS_CONCURRENCY,
  SCAN_UPLOAD_LIMITS,
  scanAreaLabel,
  scanItemLabel,
  type InventoryScanType,
} from '@shared/scan-policy';

interface UserProfile {
  cookingSkill: string;
  dietaryRestrictions: string[];
  pantryIngredients: string[];
  kitchenEquipment: string[];
  favoriteChefs: string[];
}

interface UserProfilingProps {
  onProfileComplete: (profile: UserProfile) => void;
  existingProfile?: UserProfile;
  menuSlot?: ReactNode;
  sessionScopeKey?: string;
}

type ScanType = InventoryScanType;
type ScanProgress = { completed: number; total: number } | null;
type UserProfilingDraft = {
  version: 1;
  currentStep: number;
  isToolsCaptureOpen: boolean;
  profile: UserProfile;
  manualEntry: Record<ScanType, string>;
  manualOpen: Record<ScanType, boolean>;
};

const TOTAL_STEPS = 5;
const MIN_PANTRY_INGREDIENTS = 3;
const SETUP_DRAFT_STORAGE_PREFIX = 'laica:setup-profile-draft:';
const EMPTY_PROFILE: UserProfile = {
  cookingSkill: '',
  dietaryRestrictions: [],
  pantryIngredients: [],
  kitchenEquipment: [],
  favoriteChefs: [],
};
const EMPTY_MANUAL_ENTRY: Record<ScanType, string> = { pantry: '', kitchen: '' };
const EMPTY_MANUAL_OPEN: Record<ScanType, boolean> = { pantry: false, kitchen: false };
const PANTRY_PLACEHOLDERS = [
  'raw chicken, broccoli, spaghetti',
  'parmesan, sumac, chili crisp',
  'hummus, eggs, rice',
  'ground beef, mayo, packaged salad',
];
const PANTRY_PLACEHOLDER_INDEX_KEY = 'laica:setup:pantry-placeholder-index';

const skillLevels = [
  { value: 'beginner', label: 'Beginner', description: 'I can make basic dishes', illustration: '🥄' },
  { value: 'intermediate', label: 'Intermediate', description: 'I follow recipes easily', illustration: '🍳' },
  { value: 'expert', label: 'Expert', description: 'I riff and modify dishes', illustration: '🔥' },
];

const dietaryOptions = [
  { label: 'No restrictions', illustration: '✅' },
  { label: 'Gluten Free', illustration: '🌾' },
  { label: 'Dairy Free', illustration: '🥛' },
  { label: 'Vegetarian', illustration: '🥗' },
  { label: 'Vegan', illustration: '🌱' },
  { label: 'No Red Meat', illustration: '🍗' },
  { label: 'Halal', illustration: '🍽️' },
  { label: 'Kosher', illustration: '🫓' },
  { label: 'Keto', illustration: '🥑' },
  { label: 'Paleo', illustration: '🥩' },
];

function createEmptyProfile(): UserProfile {
  return {
    ...EMPTY_PROFILE,
    dietaryRestrictions: [],
    pantryIngredients: [],
    kitchenEquipment: [],
    favoriteChefs: [],
  };
}

function normalizeStringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
    : [];
}

function normalizeProfile(value: unknown): UserProfile {
  if (typeof value !== 'object' || value === null) {
    return createEmptyProfile();
  }

  const profile = value as Partial<UserProfile>;
  return {
    cookingSkill: typeof profile.cookingSkill === 'string' ? profile.cookingSkill : '',
    dietaryRestrictions: normalizeStringList(profile.dietaryRestrictions),
    pantryIngredients: normalizeStringList(profile.pantryIngredients),
    kitchenEquipment: normalizeStringList(profile.kitchenEquipment),
    favoriteChefs: normalizeStringList(profile.favoriteChefs),
  };
}

function setupDraftStorageKey(sessionScopeKey: string) {
  return `${SETUP_DRAFT_STORAGE_PREFIX}${sessionScopeKey}`;
}

function readSetupDraft(sessionScopeKey?: string): UserProfilingDraft | null {
  if (!sessionScopeKey || typeof window === 'undefined') {
    return null;
  }

  try {
    const rawDraft = window.localStorage.getItem(setupDraftStorageKey(sessionScopeKey));
    if (!rawDraft) return null;

    const parsed = JSON.parse(rawDraft) as Partial<UserProfilingDraft>;
    if (parsed.version !== 1) return null;

    const currentStep = Number.isInteger(parsed.currentStep)
      ? Math.min(TOTAL_STEPS, Math.max(0, parsed.currentStep as number))
      : 0;
    const manualEntry = typeof parsed.manualEntry === 'object' && parsed.manualEntry !== null
      ? {
          pantry: typeof parsed.manualEntry.pantry === 'string' ? parsed.manualEntry.pantry : '',
          kitchen: typeof parsed.manualEntry.kitchen === 'string' ? parsed.manualEntry.kitchen : '',
        }
      : { ...EMPTY_MANUAL_ENTRY };
    const manualOpen = typeof parsed.manualOpen === 'object' && parsed.manualOpen !== null
      ? {
          pantry: Boolean(parsed.manualOpen.pantry),
          kitchen: Boolean(parsed.manualOpen.kitchen),
        }
      : { ...EMPTY_MANUAL_OPEN };

    return {
      version: 1,
      currentStep,
      isToolsCaptureOpen: Boolean(parsed.isToolsCaptureOpen),
      profile: normalizeProfile(parsed.profile),
      manualEntry,
      manualOpen,
    };
  } catch {
    return null;
  }
}

function writeSetupDraft(sessionScopeKey: string | undefined, draft: UserProfilingDraft) {
  if (!sessionScopeKey || typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(setupDraftStorageKey(sessionScopeKey), JSON.stringify(draft));
  } catch {
    return;
  }
}

export function clearUserProfilingSetupDraft(sessionScopeKey?: string) {
  if (!sessionScopeKey || typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(setupDraftStorageKey(sessionScopeKey));
}

function readImageAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result !== 'string') {
        reject(new Error('Failed to read image'));
        return;
      }
      resolve(result.includes(',') ? result.split(',')[1] : result);
    };
    reader.onerror = () => reject(new Error('Failed to read image'));
    reader.readAsDataURL(file);
  });
}

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const image = new Image();

    if (!context) {
      reject(new Error('Image compression is unavailable'));
      return;
    }

    image.onload = () => {
      const maxDimension = 1280;
      let { width, height } = image;

      if (width > height && width > maxDimension) {
        height = (height * maxDimension) / width;
        width = maxDimension;
      } else if (height > maxDimension) {
        width = (width * maxDimension) / height;
        height = maxDimension;
      }

      canvas.width = width;
      canvas.height = height;
      context.drawImage(image, 0, 0, width, height);
      URL.revokeObjectURL(image.src);
      resolve(canvas.toDataURL('image/jpeg', 0.82).split(',')[1]);
    };

    image.onerror = () => reject(new Error('Failed to load image'));
    image.src = URL.createObjectURL(file);
  });
}

function isAbortError(error: unknown) {
  if (typeof DOMException !== 'undefined' && error instanceof DOMException && error.name === 'AbortError') {
    return true;
  }

  const message = error instanceof Error ? error.message : String(error);
  return /abort|cancelled|canceled/i.test(message);
}

function getScanErrorFeedback(error: unknown, type: ScanType, mode: 'single' | 'batch') {
  const message = error instanceof Error ? error.message : String(error);
  const scanLabel = scanAreaLabel(type);

  if (/429|too many requests|rate limit|quota/i.test(message)) {
    return {
      title: 'Scan limit reached',
      description: 'I need to pause scans for a moment. Wait a minute, then try again, or enter items manually.',
    };
  }

  if (/413|too large|under 4 mb|smaller than 10mb|payload/i.test(message)) {
    return {
      title: 'Photo is too large',
      description: 'Choose a smaller photo or retake it closer to the item, then try again.',
    };
  }

  if (/401|403|unauthorized|forbidden/i.test(message)) {
    return {
      title: 'Sign-in needed',
      description: 'I need you to sign in again before I can scan.',
    };
  }

  if (/400|invalid image|failed to load image|failed to read image|compression is unavailable/i.test(message)) {
    return {
      title: 'Photo could not be read',
      description: "I couldn't read that photo. Try a JPEG, PNG, WebP, GIF, or HEIC photo, or enter items manually.",
    };
  }

  return {
    title: mode === 'batch' ? `${scanLabel} photos were not scanned` : `${scanLabel} photo was not scanned`,
    description: "I couldn't finish that scan. Try again in a moment, upload a clearer photo, or enter items manually.",
  };
}

function getNextPantryPlaceholder() {
  if (typeof window === 'undefined') {
    return PANTRY_PLACEHOLDERS[0];
  }

  try {
    const rawIndex = window.localStorage.getItem(PANTRY_PLACEHOLDER_INDEX_KEY);
    const currentIndex = rawIndex === null ? -1 : Number.parseInt(rawIndex, 10);
    const nextIndex = Number.isInteger(currentIndex)
      ? (currentIndex + 1) % PANTRY_PLACEHOLDERS.length
      : 0;
    window.localStorage.setItem(PANTRY_PLACEHOLDER_INDEX_KEY, String(nextIndex));
    return PANTRY_PLACEHOLDERS[nextIndex];
  } catch {
    return PANTRY_PLACEHOLDERS[0];
  }
}

export default function UserProfiling({ onProfileComplete, existingProfile, menuSlot, sessionScopeKey }: UserProfilingProps) {
  const { toast } = useToast();
  const scanRunIds = useRef<Record<ScanType, number>>({ pantry: 0, kitchen: 0 });
  const scanControllers = useRef<Record<ScanType, AbortController | null>>({ pantry: null, kitchen: null });
  const correctionHighlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [initialDraft] = useState(() => existingProfile ? null : readSetupDraft(sessionScopeKey));
  const [pantryPlaceholder] = useState(getNextPantryPlaceholder);
  const [currentStep, setCurrentStep] = useState(() => initialDraft?.currentStep ?? 0);
  const [isToolsCaptureOpen, setIsToolsCaptureOpen] = useState(() =>
    initialDraft?.isToolsCaptureOpen ?? (existingProfile?.kitchenEquipment?.length ?? 0) > 0
  );
  const [profile, setProfile] = useState<UserProfile>(() => initialDraft?.profile ?? existingProfile ?? createEmptyProfile());
  const [manualEntry, setManualEntry] = useState<Record<ScanType, string>>(() => initialDraft?.manualEntry ?? { ...EMPTY_MANUAL_ENTRY });
  const [manualOpen, setManualOpen] = useState<Record<ScanType, boolean>>(() => initialDraft?.manualOpen ?? { ...EMPTY_MANUAL_OPEN });
  const [isAnalyzing, setIsAnalyzing] = useState<Record<ScanType, boolean>>({ pantry: false, kitchen: false });
  const [scanProgress, setScanProgress] = useState<Record<ScanType, ScanProgress>>({ pantry: null, kitchen: null });
  const [recentlyCorrectedPantryKeys, setRecentlyCorrectedPantryKeys] = useState<Set<string>>(() => new Set());
  const [inventoryReviewState, setInventoryReviewState] = useState(createInventoryReviewState);

  useEffect(() => {
    writeSetupDraft(sessionScopeKey, {
      version: 1,
      currentStep,
      isToolsCaptureOpen,
      profile,
      manualEntry,
      manualOpen,
    });
  }, [currentStep, isToolsCaptureOpen, manualEntry, manualOpen, profile, sessionScopeKey]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop;
      if (scrollTop > 0 || window.scrollX > 0) {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      }

      const phoneFrame = document.querySelector<HTMLElement>('.setup-phone-frame');
      if (phoneFrame && (phoneFrame.scrollTop > 0 || phoneFrame.scrollLeft > 0)) {
        phoneFrame.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [currentStep, isToolsCaptureOpen]);

  useEffect(() => () => {
    scanControllers.current.pantry?.abort();
    scanControllers.current.kitchen?.abort();
    if (correctionHighlightTimeoutRef.current) {
      clearTimeout(correctionHighlightTimeoutRef.current);
    }
  }, []);

  const startScan = (type: ScanType, total = 1) => {
    scanControllers.current[type]?.abort();
    const controller = new AbortController();
    const id = scanRunIds.current[type] + 1;
    scanRunIds.current[type] = id;
    scanControllers.current[type] = controller;
    setIsAnalyzing((prev) => ({ ...prev, [type]: true }));
    setScanProgress((prev) => ({
      ...prev,
      [type]: total > 1 ? { completed: 0, total } : null,
    }));

    return { id, controller };
  };

  const isActiveScan = (type: ScanType, id: number, controller: AbortController) =>
    scanRunIds.current[type] === id && scanControllers.current[type] === controller && !controller.signal.aborted;

  const finishScan = (type: ScanType, id: number, controller: AbortController) => {
    if (scanRunIds.current[type] !== id || scanControllers.current[type] !== controller) {
      return;
    }

    scanControllers.current[type] = null;
    setIsAnalyzing((prev) => ({ ...prev, [type]: false }));
    setScanProgress((prev) => ({ ...prev, [type]: null }));
  };

  const cancelScan = (type: ScanType, showToast = false) => {
    if (!scanControllers.current[type] && !isAnalyzing[type]) {
      return;
    }

    scanControllers.current[type]?.abort();
    scanControllers.current[type] = null;
    scanRunIds.current[type] += 1;
    setIsAnalyzing((prev) => ({ ...prev, [type]: false }));
    setScanProgress((prev) => ({ ...prev, [type]: null }));

    if (showToast) {
      toast({
        title: 'Scan canceled',
        description: 'No new items were added from that scan.',
      });
    }
  };

  const currentItems = (type: ScanType) =>
    type === 'pantry' ? profile.pantryIngredients : profile.kitchenEquipment;

  const updateItems = (type: ScanType, items: string[]) => {
    setProfile((prev) => ({
      ...prev,
      [type === 'pantry' ? 'pantryIngredients' : 'kitchenEquipment']: items,
    }));
    setInventoryReviewState((prev) => pruneInventoryReviewType(prev, type, items));
  };

  const markReviewEntries = (type: ScanType, entries: string[], marker: 'recent' | 'found-again') => {
    setInventoryReviewState((prev) => markInventoryReviewEntries(prev, type, entries, marker));
  };

  const clearReviewEntries = (type: ScanType) => {
    setInventoryReviewState((prev) => clearInventoryReviewType(prev, type));
  };

  const foundAgainCopy = (count: number) =>
    count > 0
      ? ` ${count} saved item${count === 1 ? ' was' : 's were'} found again.`
      : '';

  const flashCorrectedPantryEntries = (entries: string[]) => {
    const keys = entries.map(normalizeEntryDuplicateKey).filter(Boolean);
    if (keys.length === 0) {
      return;
    }

    if (correctionHighlightTimeoutRef.current) {
      clearTimeout(correctionHighlightTimeoutRef.current);
    }

    setRecentlyCorrectedPantryKeys(new Set(keys));
    correctionHighlightTimeoutRef.current = setTimeout(() => {
      setRecentlyCorrectedPantryKeys(new Set());
      correctionHighlightTimeoutRef.current = null;
    }, 2200);
  };

  const showPantryCorrectionToast = (
    originalEntries: string[],
    corrections: PantryManualEntryCorrection[],
    correctedAddedEntries: string[],
  ) => {
    if (corrections.length === 0 || correctedAddedEntries.length === 0) {
      return;
    }

    const correctedAddedKeys = new Set(correctedAddedEntries.map(normalizeEntryDuplicateKey));
    flashCorrectedPantryEntries(correctedAddedEntries);

    toast({
      title: 'Corrected some entries',
      action: (
        <ToastAction
          altText="Undo spelling cleanup"
          onClick={() => {
            setRecentlyCorrectedPantryKeys(new Set());
            setProfile((prev) => {
              const withoutCorrectedBatch = prev.pantryIngredients.filter(
                (entry) => !correctedAddedKeys.has(normalizeEntryDuplicateKey(entry)),
              );

              return {
                ...prev,
                pantryIngredients: mergeUniqueEntries(withoutCorrectedBatch, originalEntries),
              };
            });
            setInventoryReviewState((prev) => markInventoryReviewEntries(
              removeInventoryReviewEntries(prev, 'pantry', correctedAddedEntries),
              'pantry',
              originalEntries,
              'recent',
            ));
          }}
        >
          Undo
        </ToastAction>
      ),
    });
  };

  const applyDetectedItems = (
    type: ScanType,
    labels: string[],
    counts: { rejectedCount?: number; failedCount?: number } = {},
  ) => {
    const rejectedCount = counts.rejectedCount ?? 0;
    const failedCount = counts.failedCount ?? 0;

    if (labels.length === 0) {
      toast({
        title: type === 'pantry' ? 'No ingredients detected' : 'No tools detected',
        description: 'Try another angle, upload a clearer photo, or enter items manually.',
      });
      return;
    }

    const mergeResult = mergeUniqueEntriesWithMetadata(currentItems(type), labels);
    updateItems(type, mergeResult.items);
    markReviewEntries(type, mergeResult.added, 'recent');
    markReviewEntries(type, mergeResult.foundAgain, 'found-again');

    if (mergeResult.added.length === 0) {
      toast({
        title: 'Already saved',
        description: `No new ${scanItemLabel(type)} were added from that scan.${foundAgainCopy(mergeResult.foundAgain.length)}`,
      });
      return;
    }

    toast({
      title: type === 'pantry' ? 'Pantry scan added items' : 'Tools scan added items',
      description: `Found ${mergeResult.added.length} new item${mergeResult.added.length === 1 ? '' : 's'}. Review the list before moving on.${
        foundAgainCopy(mergeResult.foundAgain.length)
      }${
        rejectedCount > 0 ? ` ${rejectedCount} text-only photo${rejectedCount === 1 ? ' was' : 's were'} skipped.` : ''
      }${
        failedCount > 0 ? ` ${failedCount} photo${failedCount === 1 ? ' could' : 's could'} not be scanned.` : ''
      }`,
    });
  };

  const showRejectedScanFeedback = (type: ScanType, result: VisionAnalysisResult) => {
    const feedback = getVisionRejectionFeedback(result, type);
    toast({
      ...feedback,
      variant: 'destructive',
    });
    setManualOpen((prev) => ({ ...prev, [type]: true }));
  };

  const analyzeScanImage = async (imageData: string, type: ScanType, isHEIC = false) => {
    const scan = startScan(type);
    try {
      const result = await analyzeImage(imageData, isHEIC, { signal: scan.controller.signal, scanType: type }) as VisionAnalysisResult;
      if (!isActiveScan(type, scan.id, scan.controller)) return;

      if (isRejectedVisionResult(result)) {
        showRejectedScanFeedback(type, result);
        return;
      }

      applyDetectedItems(type, extractVisionLabels(result, type));
    } catch (error) {
      if (isAbortError(error) || !isActiveScan(type, scan.id, scan.controller)) return;

      console.error(`Error analyzing ${type} image:`, error);
      const feedback = getScanErrorFeedback(error, type, 'single');
      toast({
        ...feedback,
        variant: 'destructive',
      });
    } finally {
      finishScan(type, scan.id, scan.controller);
    }
  };

  const handleBatchUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: ScanType) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (files.length === 0) return;

    const maxFiles = SCAN_UPLOAD_LIMITS[type];
    const supportedFiles = files.filter((file) => {
      const name = file.name.toLowerCase();
      return file.type.startsWith('image/') || name.endsWith('.heic') || name.endsWith('.heif');
    });

    if (supportedFiles.length > maxFiles) {
      toast({
        title: 'Too many photos',
        description: `${scanAreaLabel(type)} scan accepts up to ${maxFiles} photos per refresh. Select ${maxFiles} or fewer supported photos and try again.`,
        variant: 'destructive',
      });
      return;
    }

    if (supportedFiles.length === 0) {
      toast({
        title: 'No supported photos',
        description: 'Upload JPEG, PNG, WebP, GIF, or HEIC images.',
        variant: 'destructive',
      });
      return;
    }

    if (supportedFiles.length !== files.length) {
      toast({
        title: 'Some photos were skipped',
        description: `Unsupported files do not count toward the ${maxFiles}-photo ${type} refresh limit. Processing ${supportedFiles.length} supported photo${supportedFiles.length === 1 ? '' : 's'}.`,
      });
    }

    const scan = startScan(type, supportedFiles.length);
    const detectedLabels: string[] = [];
    let rejectedCount = 0;
    let failedCount = 0;
    let lastRejectedResult: VisionAnalysisResult | null = null;
    let lastError: unknown = null;
    let completedCount = 0;

    try {
      await processWithBoundedConcurrency(supportedFiles, SCAN_ANALYSIS_CONCURRENCY, async (file, index) => {
        if (!isActiveScan(type, scan.id, scan.controller)) return;

        try {
          const name = file.name.toLowerCase();
          const isHEIC = name.endsWith('.heic') || name.endsWith('.heif');
          const imageData = isHEIC ? await readImageAsBase64(file) : await compressImage(file);
          if (!isActiveScan(type, scan.id, scan.controller)) return;

          const result = await analyzeImage(imageData, isHEIC, { signal: scan.controller.signal, scanType: type }) as VisionAnalysisResult;
          if (!isActiveScan(type, scan.id, scan.controller)) return;

          if (isRejectedVisionResult(result)) {
            rejectedCount += 1;
            lastRejectedResult = result;
          } else {
            detectedLabels.push(...extractVisionLabels(result, type));
          }
        } catch (error) {
          if (isAbortError(error) || !isActiveScan(type, scan.id, scan.controller)) return;

          failedCount += 1;
          lastError = error;
          console.error(`Error processing ${type} photo ${index + 1}:`, error);
        } finally {
          if (isActiveScan(type, scan.id, scan.controller)) {
            completedCount += 1;
            setScanProgress((prev) => ({
              ...prev,
              [type]: { completed: completedCount, total: supportedFiles.length },
            }));
          }
        }
      }, {
        shouldContinue: () => isActiveScan(type, scan.id, scan.controller),
      });

      if (detectedLabels.length > 0) {
        applyDetectedItems(type, detectedLabels, { rejectedCount, failedCount });
      } else if (rejectedCount > 0 && lastRejectedResult) {
        showRejectedScanFeedback(type, lastRejectedResult);
      } else if (failedCount > 0 && lastError) {
        const feedback = getScanErrorFeedback(lastError, type, 'batch');
        toast({
          ...feedback,
          variant: 'destructive',
        });
      } else {
        applyDetectedItems(type, []);
      }
    } catch (error) {
      if (isAbortError(error) || !isActiveScan(type, scan.id, scan.controller)) return;

      console.error(`Error processing ${type} batch:`, error);
      const feedback = getScanErrorFeedback(error, type, 'batch');
      toast({
        ...feedback,
        variant: 'destructive',
      });
    } finally {
      finishScan(type, scan.id, scan.controller);
    }
  };

  const addManualItems = (type: ScanType) => {
    const parsed = parseCommaSeparatedEntries(manualEntry[type]);
    if (parsed.length === 0) return;

    const correctionResult = type === 'pantry'
      ? correctPantryManualEntries(parsed)
      : { entries: parsed, corrections: [] };
    const mergeResult = mergeUniqueEntriesWithMetadata(currentItems(type), correctionResult.entries);
    updateItems(type, mergeResult.items);
    markReviewEntries(type, mergeResult.added, 'recent');
    setManualEntry((prev) => ({ ...prev, [type]: '' }));
    setManualOpen((prev) => ({ ...prev, [type]: true }));

    if (type === 'pantry') {
      showPantryCorrectionToast(parsed, correctionResult.corrections, mergeResult.added);
    }
  };

  const removeItem = (type: ScanType, item: string) => {
    const key = item.toLowerCase();
    updateItems(type, currentItems(type).filter((entry) => entry.toLowerCase() !== key));
  };

  const handleDietaryToggle = (option: string) => {
    setProfile((prev) => {
      if (option === 'No restrictions') {
        return { ...prev, dietaryRestrictions: ['No restrictions'] };
      }

      const withoutNone = prev.dietaryRestrictions.filter((entry) => entry !== 'No restrictions');
      const next = withoutNone.includes(option)
        ? withoutNone.filter((entry) => entry !== option)
        : [...withoutNone, option];

      return { ...prev, dietaryRestrictions: next };
    });
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return profile.pantryIngredients.length >= MIN_PANTRY_INGREDIENTS;
      case 2:
        return true;
      case 3:
        return profile.cookingSkill.length > 0;
      case 4:
        return profile.dietaryRestrictions.length > 0;
      default:
        return true;
    }
  };

  const currentScanType: ScanType | null = currentStep === 1 ? 'pantry' : currentStep === 2 && isToolsCaptureOpen ? 'kitchen' : null;
  const isCurrentScanAnalyzing = currentScanType ? isAnalyzing[currentScanType] : false;

  const handleBack = () => {
    if (currentScanType && isAnalyzing[currentScanType]) {
      cancelScan(currentScanType, true);
    }

    if (currentStep === 2 && isToolsCaptureOpen) {
      setIsToolsCaptureOpen(false);
      return;
    }

    setCurrentStep((step) => Math.max(0, step - 1));
  };

  const handleNext = () => {
    if (currentStep === 1 && profile.pantryIngredients.length < MIN_PANTRY_INGREDIENTS) {
      toast({
        title: "There's gotta be more in your pantry!",
        description: 'Please have at least 3 ingredients to proceed.',
        variant: 'destructive',
      });
      return;
    }

    if (currentStep === TOTAL_STEPS) {
      clearUserProfilingSetupDraft(sessionScopeKey);
      onProfileComplete(profile);
      return;
    }

    if (currentScanType) {
      clearReviewEntries(currentScanType);
    }

    if (currentStep === 1) {
      setIsToolsCaptureOpen(false);
    }

    setCurrentStep((step) => Math.min(TOTAL_STEPS, step + 1));
  };

  const renderSetupProgress = () => {
    if (currentStep === 0) return null;

    return (
      <div className="setup-progress-shell mb-5" aria-label={`Setup step ${currentStep} of ${TOTAL_STEPS}`}>
        <div className="setup-progress-track" aria-hidden="true">
          <div
            className="setup-progress-fill"
            style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
          />
        </div>
        <span className="setup-progress-count">{currentStep}/{TOTAL_STEPS}</span>
      </div>
    );
  };

  const renderWelcomeStep = () => (
    <div className="flex min-h-[66vh] flex-col justify-center gap-6 py-5 text-center">
      <div className="setup-illustration mx-auto flex h-32 w-32 items-center justify-center text-primary shadow-sm">
        <div className="relative">
          <ChefHat className="h-14 w-14" />
          <ScanLine className="absolute -left-7 top-7 h-7 w-7 rotate-[-10deg] text-[hsl(var(--setup-teal))]" />
          <Sparkles className="absolute -right-7 -top-3 h-7 w-7 text-[hsl(var(--setup-butter))]" />
          <Package className="absolute -bottom-5 right-1 h-7 w-7 text-[hsl(var(--setup-herb))]" />
        </div>
      </div>

      <div className="space-y-3">
        <h1 className="setup-display text-[2.65rem] font-extrabold leading-[0.98] text-[hsl(var(--setup-ink))]">
          Yes, Chef!
        </h1>
        <p className="setup-copy mx-auto max-w-[19rem] text-base leading-relaxed">
          A quick pantry pass, a few tools, and your cooking style help Laica adapt to your kitchen.
        </p>
      </div>

      <div className="grid gap-3 text-left">
        {[
          {
            icon: ScanLine,
            title: 'Scan what is visible',
            description: 'Use the camera, upload photos, or type only what you want saved.',
          },
          {
            icon: ShieldCheck,
            title: 'Camera stays yours',
            description: 'It starts off, turns on by choice, and every list stays editable.',
          },
          {
            icon: ChefHat,
            title: 'Cook with less guessing',
            description: 'Skill and dietary notes tune the recipe suggestions.',
          },
        ].map((item) => (
          <div key={item.title} className="setup-choice flex items-start gap-3 p-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[hsl(var(--setup-coral-soft)/0.8)] text-primary">
              <item.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-extrabold text-[hsl(var(--setup-ink))]">{item.title}</p>
              <p className="setup-copy mt-0.5 text-sm leading-snug">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderScanStep = (type: ScanType) => {
    const isPantry = type === 'pantry';
    const items = currentItems(type);
    const uploadId = `${type}-setup-upload`;
    const title = isPantry ? 'Start with pantry staples.' : 'Tell me what tools you use.';
    const description = isPantry
      ? 'Point at shelves, fridge, or freezer. Labels are welcome when the food is physically visible.'
      : 'Optional: add the tools and appliances you actually cook with. Or skip for now.';
    const manualPlaceholder = isPantry ? pantryPlaceholder : 'oven, blender, sheet pan';
    const progress = scanProgress[type];

    return (
      <div className="setup-scan-step space-y-5">
        <div className="space-y-3">
          <div className="space-y-2 text-left">
            <h2 className="setup-display text-[2.25rem] font-extrabold leading-[1.02] text-[hsl(var(--setup-ink))]">
              {title}
            </h2>
            <p className="setup-copy max-w-[20rem] text-sm leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        <NativeCamera
          variant="setup"
          setupTone={isPantry ? 'pantry' : 'kitchen'}
          title={isPantry ? 'Pantry preview' : 'Tools preview'}
          captureLabel={isPantry ? 'Capture pantry' : 'Capture tools'}
          cameraToggleLabel={isPantry ? 'Pantry camera' : 'Tools camera'}
          tipsTitle={isPantry ? 'Pantry scan tips' : 'Tools scan tips'}
          tipsDescription={isPantry
            ? 'Open cabinets, use good light, and scan one area at a time.'
            : 'Point at tools and appliances you actually cook with. Fixed fixtures can stay out.'}
          showUploadButton={false}
          disabled={isAnalyzing[type]}
          onImageCapture={(imageData) => analyzeScanImage(imageData, type)}
          onError={(error) => {
            toast({
              title: 'Camera issue',
              description: error,
              variant: 'destructive',
            });
          }}
        />

        <div className="space-y-3">
          <input
            id={uploadId}
            type="file"
            accept="image/*,.heic,.heif"
            multiple
            className="hidden"
            onChange={(event) => handleBatchUpload(event, type)}
          />
          <div className="grid gap-3">
            <Button
              type="button"
              variant="ghost"
              className="setup-secondary-button h-14 w-full justify-start px-4"
              disabled={isAnalyzing[type]}
              onClick={() => document.getElementById(uploadId)?.click()}
            >
              <span className={`setup-action-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[hsl(var(--setup-coral-soft)/0.85)] text-primary ${!isPantry ? 'setup-kitchen-action-icon' : ''}`}>
                <ImagePlus className="h-4 w-4" />
              </span>
              <span className="flex flex-col items-start leading-tight">
                <span className="setup-action-title">Upload photos</span>
              </span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="setup-secondary-button h-14 w-full justify-start px-4"
              disabled={isAnalyzing[type]}
              onClick={() => setManualOpen((prev) => ({ ...prev, [type]: !prev[type] }))}
              aria-expanded={manualOpen[type]}
              aria-pressed={manualOpen[type]}
              data-active={manualOpen[type] ? 'true' : undefined}
            >
              <span className={`setup-action-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[hsl(var(--setup-butter)/0.42)] text-[hsl(var(--setup-herb))] ${!isPantry ? 'setup-kitchen-action-icon' : ''}`}>
                <Package className="h-4 w-4" />
              </span>
              <span className="flex flex-col items-start leading-tight">
                <span className="setup-action-title">Enter manually</span>
              </span>
            </Button>
          </div>

          {manualOpen[type] && (
            <div className="setup-surface space-y-3 p-4">
              <div className="flex items-center gap-3">
                <div className={`setup-illustration flex h-12 w-12 shrink-0 items-center justify-center text-primary ${!isPantry ? 'setup-kitchen-illustration' : ''}`}>
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-extrabold text-[hsl(var(--setup-ink))]">
                    {isPantry ? 'Add pantry items' : 'Add tools'}
                  </p>
                  <p className="setup-copy text-xs">Use short names so the list stays easy to skim.</p>
                </div>
              </div>
              <div className="space-y-3">
                <Input
                  aria-label={isPantry ? 'Pantry items' : 'Tools'}
                  value={manualEntry[type]}
                  onChange={(event) => setManualEntry((prev) => ({ ...prev, [type]: event.target.value }))}
                  placeholder={manualPlaceholder}
                  className={`h-12 rounded-2xl border-primary/20 bg-white/75 text-base font-bold placeholder:text-muted-foreground ${!isPantry ? 'setup-kitchen-input' : ''}`}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addManualItems(type);
                    }
                  }}
                />
                {isPantry && (
                  <p className="setup-copy px-1 text-xs">Separate pantry items with commas.</p>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  className={`setup-primary-button h-12 w-full ${!isPantry ? 'setup-kitchen-primary-button' : ''}`}
                  onClick={() => addManualItems(type)}
                >
                  {isPantry ? 'Save ingredients' : 'Add tools'}
                </Button>
              </div>
            </div>
          )}

        </div>

        {isAnalyzing[type] && (
          <div className="setup-surface p-4 text-center text-primary">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--setup-coral-soft)/0.9)]">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
            <p className="mt-2 text-sm font-extrabold">
              {progress
                ? `Analyzing ${progress.completed} of ${progress.total} ${isPantry ? 'pantry' : 'tools'} photos...`
                : isPantry ? 'Scanning pantry photos...' : 'Scanning tools photos...'}
            </p>
            <p className="setup-copy mt-1 text-xs">Keeping only visible food and cooking items.</p>
          </div>
        )}

        {items.length > 0 && (
          <div className="setup-surface space-y-3 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-extrabold text-[hsl(var(--setup-ink))]">
                  {isPantry ? 'Your pantry list' : 'Your tools list'}
                </p>
                <p className="setup-copy text-xs">Edit anything I missed.</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => updateItems(type, [])}
                className="setup-ghost-button"
              >
                Clear
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {items.map((item) => {
                const wasRecentlyCorrected = isPantry
                  && recentlyCorrectedPantryKeys.has(normalizeEntryDuplicateKey(item));

                return (
                  <InventoryReviewChip
                    key={item}
                    item={item}
                    state={getInventoryReviewChipState(inventoryReviewState, type, item)}
                    wasRecentlyCorrected={wasRecentlyCorrected}
                    disabled={isAnalyzing[type]}
                    onRemove={() => removeItem(type, item)}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderToolsIntroStep = () => (
    <div className="flex min-h-[58vh] flex-col justify-center gap-5 py-5">
      <div className="setup-illustration mx-auto flex h-28 w-28 items-center justify-center text-primary shadow-sm">
        <div className="relative">
          <CookingPot className="h-12 w-12" />
          <Check className="absolute -right-5 -top-3 h-7 w-7 rounded-full bg-primary p-1 text-primary-foreground" />
        </div>
      </div>

      <div className="space-y-3 text-center">
        <h2 className="setup-display text-[2.25rem] font-extrabold leading-[1.02] text-[hsl(var(--setup-ink))]">
          Any kitchen tools to add?
        </h2>
        <p className="setup-copy mx-auto max-w-[20rem] text-sm leading-relaxed">
          Totally optional! Proceed to <strong>Add tools</strong> if you cook with special appliances like an air fryer, rice cooker, sous-vide contraptions, etc.
        </p>
      </div>

      <div className="setup-surface space-y-3 p-4">
        <div className="flex items-start gap-3">
          <div className="setup-illustration flex h-12 w-12 shrink-0 items-center justify-center text-primary setup-kitchen-illustration">
            <UtensilsCrossed className="h-5 w-5" />
          </div>
          <div>
            <p className="font-extrabold text-[hsl(var(--setup-ink))]">Ready to scan your kitchen for tools?</p>
            <p className="setup-copy text-xs">
              We'll stick to common kitchen basics if you choose to skip.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="setup-primary-button setup-kitchen-primary-button h-12 w-full"
          onClick={() => setIsToolsCaptureOpen(true)}
        >
          Add tools
        </Button>
      </div>
    </div>
  );

  const renderSkillStep = () => (
    <div className="space-y-5">
      <div className="space-y-3">
        <h2 className="setup-display text-[2.25rem] font-extrabold leading-[1.02] text-[hsl(var(--setup-ink))]">
          How comfortable are you with cooking?
        </h2>
        <p className="setup-copy max-w-[19rem] text-sm leading-relaxed">
          You will get guidance based on this. You can change this later.
        </p>
      </div>

      <div role="radiogroup" aria-label="Cooking skill level" className="space-y-3">
        {skillLevels.map((skill) => {
          const selected = profile.cookingSkill === skill.value;
          return (
            <button
              key={skill.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => {
                setProfile((prev) => ({ ...prev, cookingSkill: skill.value }));
                setCurrentStep(4);
              }}
              data-selected={selected}
              className="setup-choice flex w-full items-center gap-4 p-4 text-left transition"
            >
              <span className="setup-illustration-token h-14 w-14 shrink-0" aria-hidden="true">
                {skill.illustration}
              </span>
              <span className="flex-1">
                <span className="block font-extrabold text-[hsl(var(--setup-ink))]">{skill.label}</span>
                <span className="setup-copy text-sm">{skill.description}</span>
              </span>
              {selected && <Check className="h-5 w-5 text-primary" />}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderDietaryStep = () => (
    <div className="space-y-5">
      <div className="space-y-3">
        <h2 className="setup-display text-[2.25rem] font-extrabold leading-[1.02] text-[hsl(var(--setup-ink))]">
          Anything I should avoid?
        </h2>
        <p className="setup-copy max-w-[18rem] text-sm leading-relaxed">
          Select all that apply.
        </p>
      </div>

      <div className="space-y-2">
        {dietaryOptions.slice(0, 1).map((diet) => {
          const option = diet.label;
          const selected = profile.dietaryRestrictions.includes(option);
          return (
            <button
              key={option}
              type="button"
              aria-pressed={selected}
              onClick={() => handleDietaryToggle(option)}
              data-selected={selected}
              className="setup-choice setup-none-choice mb-5 flex w-full items-center gap-4 p-4 text-left transition"
            >
              <span className="setup-illustration-token h-14 w-14 shrink-0" aria-hidden="true">
                {diet.illustration}
              </span>
              <span className="flex-1">
                <span className="block font-extrabold text-[hsl(var(--setup-ink))]">{option}</span>
                <span className="setup-copy text-sm">Use this when there is nothing special to avoid.</span>
              </span>
              <span className={`flex h-6 w-6 items-center justify-center rounded-full border ${selected ? 'border-primary bg-primary text-primary-foreground' : 'border-[hsl(var(--setup-ink)/0.24)]'}`}>
                {selected && <Check className="h-3.5 w-3.5" />}
              </span>
            </button>
          );
        })}

        {dietaryOptions.slice(1).map((diet) => {
          const option = diet.label;
          const selected = profile.dietaryRestrictions.includes(option);
          return (
            <button
              key={option}
              type="button"
              aria-pressed={selected}
              onClick={() => handleDietaryToggle(option)}
              data-selected={selected}
              className="setup-choice flex w-full items-center gap-3 p-3 text-left transition"
            >
              <span className="setup-illustration-token h-11 w-11 shrink-0 text-[1.35rem]" aria-hidden="true">
                {diet.illustration}
              </span>
              <span className="flex-1 font-extrabold text-[hsl(var(--setup-ink))]">{option}</span>
              <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${selected ? 'border-primary bg-primary text-primary-foreground' : 'border-[hsl(var(--setup-ink)/0.24)]'}`}>
                {selected && <Check className="h-3 w-3" />}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderConfirmStep = () => (
    <div className="space-y-5">
      <div className="space-y-3 text-center">
        <div className="setup-illustration mx-auto flex h-28 w-28 items-center justify-center text-primary">
          <Check className="h-14 w-14 rounded-full bg-primary p-3 text-primary-foreground" />
        </div>
        <h2 className="setup-display text-[2.35rem] font-extrabold leading-[1.02] text-[hsl(var(--setup-ink))]">
          You are ready.
        </h2>
        <p className="setup-copy mx-auto max-w-xs text-sm leading-relaxed">
          We will use this to keep suggestions grounded in your real kitchen.
        </p>
      </div>

      <div className="setup-surface space-y-4 p-4">
          <div className="flex items-start gap-3">
            <span className="setup-illustration-token h-11 w-11 shrink-0 text-[1.35rem]" aria-hidden="true">
              🧺
            </span>
            <div>
              <p className="font-extrabold text-[hsl(var(--setup-ink))]">Pantry</p>
              <p className="setup-copy text-sm">
                {profile.pantryIngredients.length} item{profile.pantryIngredients.length === 1 ? '' : 's'} saved
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="setup-illustration-token h-11 w-11 shrink-0 text-[1.35rem]" aria-hidden="true">
              🍳
            </span>
            <div>
              <p className="font-extrabold text-[hsl(var(--setup-ink))]">Tools</p>
              <p className="setup-copy text-sm">
                {profile.kitchenEquipment.length > 0
                  ? `${profile.kitchenEquipment.length} item${profile.kitchenEquipment.length === 1 ? '' : 's'} saved`
                  : 'Skipped for now'}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="setup-illustration-token h-11 w-11 shrink-0 text-[1.35rem]" aria-hidden="true">
              👩‍🍳
            </span>
            <div>
              <p className="font-extrabold text-[hsl(var(--setup-ink))]">Skill</p>
              <p className="setup-copy text-sm capitalize">{profile.cookingSkill}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="setup-illustration-token h-11 w-11 shrink-0 text-[1.35rem]" aria-hidden="true">
              🥗
            </span>
            <div>
              <p className="font-extrabold text-[hsl(var(--setup-ink))]">Dietary notes</p>
              <p className="setup-copy text-sm">
                {profile.dietaryRestrictions.join(', ')}
              </p>
            </div>
          </div>
      </div>
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return renderScanStep('pantry');
      case 2:
        return isToolsCaptureOpen ? renderScanStep('kitchen') : renderToolsIntroStep();
      case 3:
        return renderSkillStep();
      case 4:
        return renderDietaryStep();
      case 5:
        return renderConfirmStep();
      case 0:
        return renderWelcomeStep();
      default:
        return null;
    }
  };

  const nextLabel = currentStep === 2 && !isToolsCaptureOpen
    ? 'Skip tools'
    : currentStep === 2 && profile.kitchenEquipment.length === 0
    ? 'Skip for now'
    : currentStep === TOTAL_STEPS
      ? 'Finish setup'
      : 'Next';
  const isKitchenSetup = currentStep === 2;

  return (
    <main className={`setup-ui ${isKitchenSetup ? 'setup-ui-kitchen' : ''}`}>
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-3 pt-3">
        <section className="setup-phone-frame flex flex-1 flex-col px-4 pt-4">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              {renderSetupProgress()}
            </div>
            {menuSlot && (
              <div className={currentStep === 0 ? '' : 'pt-0.5'}>
                {menuSlot}
              </div>
            )}
          </div>

          <div className="flex-1 pb-5">
            {renderStep()}
          </div>

          <div className="setup-bottom-bar sticky bottom-0 -mx-4 mt-2 px-4 py-4">
            {currentStep === 0 ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCurrentStep(1)}
                className="setup-primary-button h-14 w-full text-base"
              >
                Get started
              </Button>
            ) : (
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleBack}
                  className="setup-secondary-button h-12 flex-1"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                {currentStep !== 3 && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleNext}
                    disabled={(currentStep !== 1 && !canProceed()) || isCurrentScanAnalyzing}
                    className="setup-primary-button h-12 flex-[1.4]"
                  >
                    {nextLabel}
                  </Button>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
