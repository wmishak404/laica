import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { NativeCamera } from '@/components/ui/native-camera';
import { useToast } from '@/hooks/use-toast';
import { mergeUniqueEntries, parseCommaSeparatedEntries } from '@/lib/entryParsing';
import { analyzeImage } from '@/lib/openai';
import {
  ArrowLeft,
  Camera,
  Check,
  ChefHat,
  ImagePlus,
  Leaf,
  Lightbulb,
  Loader2,
  Package,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Utensils,
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
}

type ScanType = 'pantry' | 'kitchen';

const TOTAL_STEPS = 5;
const MAX_UPLOADS: Record<ScanType, number> = {
  pantry: 8,
  kitchen: 6,
};

const skillLevels = [
  { value: 'beginner', label: 'Beginner', description: 'I can make basic dishes', icon: ChefHat },
  { value: 'intermediate', label: 'Intermediate', description: 'I follow recipes easily', icon: Utensils },
  { value: 'expert', label: 'Expert', description: 'I riff and modify dishes', icon: Sparkles },
];

const dietaryOptions = [
  'No restrictions',
  'Gluten Free',
  'Dairy Free',
  'Vegetarian',
  'Vegan',
  'No Red Meat',
  'Halal',
  'Kosher',
  'Keto',
  'Paleo',
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

export default function UserProfiling({ onProfileComplete, existingProfile }: UserProfilingProps) {
  const { toast } = useToast();
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
    setIsAnalyzing((prev) => ({ ...prev, [type]: true }));
    try {
      const result = await analyzeImage(imageData, isHEIC) as VisionAnalysisResult;
      if (isRejectedVisionResult(result)) {
        showRejectedScanFeedback(type, result);
        return;
      }

      applyDetectedItems(type, extractVisionLabels(result, type));
    } catch (error) {
      console.error(`Error analyzing ${type} image:`, error);
      toast({
        title: 'Scan did not finish',
        description: 'Try again, upload a photo, or enter items manually.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleBatchUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: ScanType) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (files.length === 0) return;

    const maxFiles = MAX_UPLOADS[type];
    const selectedFiles = files.slice(0, maxFiles);
    const skippedForLimit = Math.max(files.length - selectedFiles.length, 0);
    const supportedFiles = selectedFiles.filter((file) => {
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

    if (skippedForLimit > 0 || supportedFiles.length !== files.length) {
      toast({
        title: 'Some photos were skipped',
        description: `${type === 'pantry' ? 'Pantry' : 'Kitchen'} scan accepts up to ${maxFiles} photos per batch.`,
      });
    }

    setIsAnalyzing((prev) => ({ ...prev, [type]: true }));
    const detectedLabels: string[] = [];
    let rejectedCount = 0;
    let lastRejectedResult: VisionAnalysisResult | null = null;

    try {
      for (const file of supportedFiles) {
        const name = file.name.toLowerCase();
        const isHEIC = name.endsWith('.heic') || name.endsWith('.heif');
        const imageData = isHEIC ? await readImageAsBase64(file) : await compressImage(file);
        const result = await analyzeImage(imageData, isHEIC) as VisionAnalysisResult;
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
      console.error(`Error processing ${type} batch:`, error);
      toast({
        title: 'Some photos could not be scanned',
        description: 'Review what was added, then try the missed angle again.',
        variant: 'destructive',
      });
      if (detectedLabels.length > 0) {
        applyDetectedItems(type, detectedLabels);
      }
    } finally {
      setIsAnalyzing((prev) => ({ ...prev, [type]: false }));
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
        return profile.pantryIngredients.length > 0;
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

  const renderWelcomeStep = () => (
    <div className="flex min-h-[68vh] flex-col justify-center space-y-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <ChefHat className="h-8 w-8" />
      </div>

      <div>
        <h1 className="text-4xl font-bold leading-tight text-foreground">Let&apos;s set up your kitchen.</h1>
        <p className="mx-auto mt-3 max-w-xs text-base leading-relaxed text-muted-foreground">
          A few quick notes help LAICA suggest meals that fit what you have, what you use, and how you like to cook.
        </p>
      </div>

      <div className="grid gap-3 text-left">
        {[
          {
            icon: ScanLine,
            title: 'Start with what is visible',
            description: 'Scan photos, upload them, or type items in yourself.',
          },
          {
            icon: ShieldCheck,
            title: 'You stay in control',
            description: 'Camera is off until you turn it on, and every list is editable.',
          },
          {
            icon: ChefHat,
            title: 'Cook with less guessing',
            description: 'Skill and dietary notes shape the recipes LAICA suggests.',
          },
        ].map((item) => (
          <div key={item.title} className="flex items-start gap-3 rounded-xl border bg-card p-3 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <item.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-card-foreground">{item.title}</p>
              <p className="mt-0.5 text-sm leading-snug text-muted-foreground">{item.description}</p>
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
    const title = isPantry ? "Let's take note of what you have." : "Now let's note your kitchen tools.";
    const description = isPantry
      ? 'Scan shelves, fridge, or freezer photos. You can upload instead, or type only what you want saved.'
      : "Add the tools and appliances you actually cook with, then skip anything you don't want tracked.";

    return (
      <div className="space-y-5">
        <div className="text-center">
          <p className="mx-auto mb-3 w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            {currentStep} of {TOTAL_STEPS}
          </p>
          <h2 className="text-3xl font-bold text-foreground">
            {title}
          </h2>
          <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
            {description}
          </p>
        </div>

        <NativeCamera
          title={isPantry ? 'Pantry preview' : 'Kitchen preview'}
          captureLabel={isPantry ? 'Capture pantry' : 'Capture kitchen'}
          cameraToggleLabel={isPantry ? 'Pantry camera' : 'Kitchen camera'}
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
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-14 flex-col gap-1"
              disabled={isAnalyzing[type]}
              onClick={() => document.getElementById(uploadId)?.click()}
            >
              <ImagePlus className="h-4 w-4" />
              <span>Upload photos</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-14 flex-col gap-1"
              disabled={isAnalyzing[type]}
              onClick={() => setManualOpen((prev) => ({ ...prev, [type]: !prev[type] }))}
              aria-expanded={manualOpen[type]}
            >
              <Package className="h-4 w-4" />
              <span>Enter manually</span>
            </Button>
          </div>

          {manualOpen[type] && (
            <Card className="border-primary/15 bg-primary/5 shadow-sm">
              <CardContent className="space-y-3 p-3">
                <Input
                  value={manualEntry[type]}
                  onChange={(event) => setManualEntry((prev) => ({ ...prev, [type]: event.target.value }))}
                  placeholder={isPantry ? 'buns, mayo, tomatoes' : 'oven, blender, sheet pan'}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addManualItems(type);
                    }
                  }}
                />
                <Button type="button" className="w-full" onClick={() => addManualItems(type)}>
                  Save {isPantry ? 'ingredients' : 'equipment'}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Use commas to add multiple items at once.
                </p>
              </CardContent>
            </Card>
          )}

          <Dialog>
            <DialogTrigger asChild>
              <Button type="button" variant="ghost" className="h-10 w-full text-muted-foreground">
                <Lightbulb className="mr-2 h-4 w-4" />
                Scanning tips
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm rounded-lg">
              <DialogHeader>
                <DialogTitle>{isPantry ? 'Pantry scan tips' : 'Kitchen scan tips'}</DialogTitle>
                <DialogDescription>
                  {isPantry
                    ? 'Open cabinets, use good light, and scan one area at a time.'
                    : 'Point at tools and appliances you actually cook with. Fixed fixtures can stay out.'}
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </div>

        {isAnalyzing[type] && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center text-primary">
            <Loader2 className="mx-auto h-5 w-5 animate-spin" />
            <p className="mt-2 text-sm font-semibold">
              {isPantry ? 'Scanning pantry photos...' : 'Scanning kitchen photos...'}
            </p>
            <p className="mt-1 text-xs text-primary/75">Keeping only visible food and cooking items.</p>
          </div>
        )}

        {items.length > 0 && (
          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{isPantry ? 'Your pantry list' : 'Your kitchen list'}</p>
                  <p className="text-xs text-muted-foreground">Edit anything I missed.</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => updateItems(type, [])}
                  className="text-muted-foreground"
                >
                  Clear
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {items.map((item) => (
                  <span
                    key={item}
                    className="inline-flex max-w-full items-center gap-1 rounded-lg border border-primary/15 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
                  >
                    <span className="truncate">{item}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${item}`}
                      className="rounded-full p-0.5 text-primary/70 hover:bg-primary/10 hover:text-primary"
                      onClick={() => removeItem(type, item)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderSkillStep = () => (
    <div className="space-y-5">
      <div className="text-center">
        <p className="mx-auto mb-3 w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {currentStep} of {TOTAL_STEPS}
        </p>
        <h2 className="text-3xl font-bold text-foreground">How comfortable are you cooking?</h2>
        <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
          This helps me guide you better.
        </p>
      </div>

      <div role="radiogroup" aria-label="Cooking skill level" className="space-y-3">
        {skillLevels.map((skill) => {
          const Icon = skill.icon;
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
              className={`flex w-full items-center gap-4 rounded-lg border p-4 text-left transition ${
                selected ? 'border-primary bg-primary/10 text-foreground' : 'border-border bg-card'
              }`}
            >
              <span className={`flex h-11 w-11 items-center justify-center rounded-lg ${selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="flex-1">
                <span className="block font-semibold">{skill.label}</span>
                <span className="text-sm text-muted-foreground">{skill.description}</span>
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
      <div className="text-center">
        <p className="mx-auto mb-3 w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {currentStep} of {TOTAL_STEPS}
        </p>
        <h2 className="text-3xl font-bold text-foreground">Anything I should avoid?</h2>
        <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
          Select all that apply.
        </p>
      </div>

      <div className="space-y-2">
        {dietaryOptions.map((option) => {
          const selected = profile.dietaryRestrictions.includes(option);
          return (
            <button
              key={option}
              type="button"
              aria-pressed={selected}
              onClick={() => handleDietaryToggle(option)}
              className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition ${
                selected ? 'border-primary bg-primary/10' : 'border-border bg-card'
              }`}
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                <Leaf className="h-4 w-4" />
              </span>
              <span className="flex-1 font-medium">{option}</span>
              <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${selected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40'}`}>
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
      <div className="text-center">
        <p className="mx-auto mb-3 w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {currentStep} of {TOTAL_STEPS}
        </p>
        <h2 className="text-3xl font-bold text-foreground">You are ready.</h2>
        <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
          We will use this to keep suggestions grounded in your real kitchen.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex items-start gap-3">
            <Package className="mt-1 h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold">Pantry</p>
              <p className="text-sm text-muted-foreground">
                {profile.pantryIngredients.length} item{profile.pantryIngredients.length === 1 ? '' : 's'} saved
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Utensils className="mt-1 h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold">Kitchen tools</p>
              <p className="text-sm text-muted-foreground">
                {profile.kitchenEquipment.length > 0
                  ? `${profile.kitchenEquipment.length} item${profile.kitchenEquipment.length === 1 ? '' : 's'} saved`
                  : 'Skipped for now'}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <ChefHat className="mt-1 h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold">Skill</p>
              <p className="text-sm capitalize text-muted-foreground">{profile.cookingSkill}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Leaf className="mt-1 h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold">Dietary notes</p>
              <p className="text-sm text-muted-foreground">
                {profile.dietaryRestrictions.join(', ')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
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

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background px-5 pb-6 pt-5">
      <div className="mb-4 flex items-center justify-center">
        <Camera className="mr-2 h-5 w-5 text-primary" />
        <span className="text-sm font-semibold text-muted-foreground">Laica setup</span>
      </div>

      <div className="flex-1">
        {renderStep()}
      </div>

      {currentStep === 0 ? (
        <div className="mt-6">
          <Button type="button" onClick={() => setCurrentStep(1)} className="h-12 w-full">
            Get started
          </Button>
        </div>
      ) : (
        <div className="mt-6 flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setCurrentStep((step) => Math.max(0, step - 1))}
            className="h-12 flex-1"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          {currentStep !== 3 && (
            <Button
              type="button"
              onClick={() => {
                if (currentStep === TOTAL_STEPS) {
                  onProfileComplete(profile);
                  return;
                }
                setCurrentStep((step) => Math.min(TOTAL_STEPS, step + 1));
              }}
              disabled={!canProceed()}
              className="h-12 flex-[1.4]"
            >
              {nextLabel}
            </Button>
          )}
        </div>
      )}
    </main>
  );
}
