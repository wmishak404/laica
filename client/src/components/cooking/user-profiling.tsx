import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeCamera } from '@/components/ui/native-camera';
import { useToast } from '@/hooks/use-toast';
import { mergeUniqueEntries, parseCommaSeparatedEntries } from '@/lib/entryParsing';
import { analyzeImage } from '@/lib/openai';
import {
  ArrowLeft,
  Check,
  ChefHat,
  ImagePlus,
  Leaf,
  Loader2,
  Package,
  ScanLine,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import {
  extractVisionLabels,
  getVisionRejectionFeedback,
  isRejectedVisionResult,
  type VisionAnalysisResult,
} from '@/lib/visionResult';

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
}

type ScanType = 'pantry' | 'kitchen';

const TOTAL_STEPS = 5;
const MAX_UPLOADS: Record<ScanType, number> = {
  pantry: 8,
  kitchen: 6,
};
const MIN_PANTRY_INGREDIENTS = 3;
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
  if (error instanceof DOMException && error.name === 'AbortError') {
    return true;
  }

  const message = error instanceof Error ? error.message : String(error);
  return /abort|cancelled|canceled/i.test(message);
}

function getScanErrorFeedback(error: unknown, type: ScanType, mode: 'single' | 'batch') {
  const message = error instanceof Error ? error.message : String(error);
  const scanLabel = type === 'pantry' ? 'Pantry' : 'Kitchen';

  if (/429|too many requests|rate limit|quota/i.test(message)) {
    return {
      title: 'Scan limit reached',
      description: 'You made several scans quickly. Wait a minute, then try again, or enter items manually.',
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
      description: 'Refresh your sign-in, then try the scan again.',
    };
  }

  if (/400|invalid image|failed to load image|failed to read image|compression is unavailable/i.test(message)) {
    return {
      title: 'Photo could not be read',
      description: 'Try a JPEG, PNG, WebP, GIF, or HEIC photo, or enter items manually.',
    };
  }

  return {
    title: mode === 'batch' ? `${scanLabel} photos were not scanned` : `${scanLabel} photo was not scanned`,
    description: 'Nothing new was added from that attempt. Try again in a moment, upload a clearer photo, or enter items manually.',
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

export default function UserProfiling({ onProfileComplete, existingProfile, menuSlot }: UserProfilingProps) {
  const { toast } = useToast();
  const scanRunIds = useRef<Record<ScanType, number>>({ pantry: 0, kitchen: 0 });
  const scanControllers = useRef<Record<ScanType, AbortController | null>>({ pantry: null, kitchen: null });
  const [pantryPlaceholder] = useState(getNextPantryPlaceholder);
  const [currentStep, setCurrentStep] = useState(0);
  const [profile, setProfile] = useState<UserProfile>(existingProfile || {
    cookingSkill: '',
    dietaryRestrictions: [],
    pantryIngredients: [],
    kitchenEquipment: [],
    favoriteChefs: [],
  });
  const [manualEntry, setManualEntry] = useState<Record<ScanType, string>>({ pantry: '', kitchen: '' });
  const [manualOpen, setManualOpen] = useState<Record<ScanType, boolean>>({ pantry: false, kitchen: false });
  const [isAnalyzing, setIsAnalyzing] = useState<Record<ScanType, boolean>>({ pantry: false, kitchen: false });

  useEffect(() => () => {
    scanControllers.current.pantry?.abort();
    scanControllers.current.kitchen?.abort();
  }, []);

  const startScan = (type: ScanType) => {
    scanControllers.current[type]?.abort();
    const controller = new AbortController();
    const id = scanRunIds.current[type] + 1;
    scanRunIds.current[type] = id;
    scanControllers.current[type] = controller;
    setIsAnalyzing((prev) => ({ ...prev, [type]: true }));

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
  };

  const cancelScan = (type: ScanType, showToast = false) => {
    if (!scanControllers.current[type] && !isAnalyzing[type]) {
      return;
    }

    scanControllers.current[type]?.abort();
    scanControllers.current[type] = null;
    scanRunIds.current[type] += 1;
    setIsAnalyzing((prev) => ({ ...prev, [type]: false }));

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
  };

  const applyDetectedItems = (type: ScanType, labels: string[], skippedCount = 0) => {
    if (labels.length === 0) {
      toast({
        title: type === 'pantry' ? 'No ingredients detected' : 'No equipment detected',
        description: 'Try another angle, upload a clearer photo, or enter items manually.',
      });
      return;
    }

    setProfile((prev) => {
      const key = type === 'pantry' ? 'pantryIngredients' : 'kitchenEquipment';
      return {
        ...prev,
        [key]: mergeUniqueEntries(prev[key], labels),
      };
    });

    toast({
      title: type === 'pantry' ? 'Pantry scan added items' : 'Kitchen scan added items',
      description: `Found ${labels.length} item${labels.length === 1 ? '' : 's'}. Review the list before moving on.${
        skippedCount > 0 ? ` ${skippedCount} text-only photo${skippedCount === 1 ? ' was' : 's were'} skipped.` : ''
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

    const maxFiles = MAX_UPLOADS[type];
    if (files.length > maxFiles) {
      toast({
        title: 'Too many photos',
        description: `${type === 'pantry' ? 'Pantry' : 'Kitchen'} scan accepts up to ${maxFiles} photos per batch. Select ${maxFiles} or fewer and try again.`,
        variant: 'destructive',
      });
      return;
    }

    const supportedFiles = files.filter((file) => {
      const name = file.name.toLowerCase();
      return file.type.startsWith('image/') || name.endsWith('.heic') || name.endsWith('.heif');
    });

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
        description: `${type === 'pantry' ? 'Pantry' : 'Kitchen'} scan accepts up to ${maxFiles} photos per batch.`,
      });
    }

    const scan = startScan(type);
    const detectedLabels: string[] = [];
    let rejectedCount = 0;
    let lastRejectedResult: VisionAnalysisResult | null = null;

    try {
      for (const file of supportedFiles) {
        if (!isActiveScan(type, scan.id, scan.controller)) return;

        const name = file.name.toLowerCase();
        const isHEIC = name.endsWith('.heic') || name.endsWith('.heif');
        const imageData = isHEIC ? await readImageAsBase64(file) : await compressImage(file);
        if (!isActiveScan(type, scan.id, scan.controller)) return;

        const result = await analyzeImage(imageData, isHEIC, { signal: scan.controller.signal, scanType: type }) as VisionAnalysisResult;
        if (!isActiveScan(type, scan.id, scan.controller)) return;

        if (isRejectedVisionResult(result)) {
          rejectedCount += 1;
          lastRejectedResult = result;
          continue;
        }

        detectedLabels.push(...extractVisionLabels(result, type));
      }

      if (detectedLabels.length > 0) {
        applyDetectedItems(type, detectedLabels, rejectedCount);
      } else if (rejectedCount > 0 && lastRejectedResult) {
        showRejectedScanFeedback(type, lastRejectedResult);
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

    const merged = mergeUniqueEntries(currentItems(type), parsed);
    updateItems(type, merged);
    setManualEntry((prev) => ({ ...prev, [type]: '' }));
    setManualOpen((prev) => ({ ...prev, [type]: true }));
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

  const currentScanType: ScanType | null = currentStep === 1 ? 'pantry' : currentStep === 2 ? 'kitchen' : null;
  const isCurrentScanAnalyzing = currentScanType ? isAnalyzing[currentScanType] : false;

  const handleBack = () => {
    if (currentScanType && isAnalyzing[currentScanType]) {
      cancelScan(currentScanType, true);
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
      onProfileComplete(profile);
      return;
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
      : "Add the tools and appliances you actually cook with. Skip anything you don't want tracked.";
    const manualPlaceholder = isPantry ? pantryPlaceholder : 'oven, blender, sheet pan';

    return (
      <div className="space-y-5">
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
          title={isPantry ? 'Pantry preview' : 'Kitchen preview'}
          captureLabel={isPantry ? 'Capture pantry' : 'Capture kitchen'}
          cameraToggleLabel={isPantry ? 'Pantry camera' : 'Kitchen camera'}
          tipsTitle={isPantry ? 'Pantry scan tips' : 'Kitchen scan tips'}
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
                    {isPantry ? 'Add pantry items' : 'Add kitchen tools'}
                  </p>
                  <p className="setup-copy text-xs">Use short names so the list stays easy to skim.</p>
                </div>
              </div>
              <div className="space-y-3">
                <Input
                  aria-label={isPantry ? 'Pantry items' : 'Kitchen tools'}
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
                  Save {isPantry ? 'ingredients' : 'equipment'}
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
              {isPantry ? 'Scanning pantry photos...' : 'Scanning kitchen photos...'}
            </p>
            <p className="setup-copy mt-1 text-xs">Keeping only visible food and cooking items.</p>
          </div>
        )}

        {items.length > 0 && (
          <div className="setup-surface space-y-3 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-extrabold text-[hsl(var(--setup-ink))]">
                  {isPantry ? 'Your pantry list' : 'Your kitchen list'}
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
              {items.map((item) => (
                <span key={item} className={`setup-chip ${!isPantry ? 'setup-kitchen-chip' : ''}`}>
                  <span className="truncate">{item}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${item}`}
                    className={`rounded-full p-0.5 ${
                      isPantry
                        ? 'text-primary/70 hover:bg-primary/10 hover:text-primary'
                        : 'setup-kitchen-chip-remove'
                    }`}
                    onClick={() => removeItem(type, item)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

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
          <div className="relative">
            <ChefHat className="h-12 w-12" />
            <Check className="absolute -right-5 -top-3 h-7 w-7 rounded-full bg-primary p-1 text-primary-foreground" />
            <Leaf className="absolute -bottom-4 -left-5 h-7 w-7 text-[hsl(var(--setup-herb))]" />
          </div>
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
              <p className="font-extrabold text-[hsl(var(--setup-ink))]">Kitchen tools</p>
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
        return renderScanStep('kitchen');
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

  const nextLabel = currentStep === 2 && profile.kitchenEquipment.length === 0
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
