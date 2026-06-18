import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ToastAction } from '@/components/ui/toast';
import { fetchPantryRecipes, resolveSelectedRecipeImage } from '@/lib/openai';
import { withAiErrorHandling } from '@/lib/rateLimitHandler';
import { useToast } from '@/hooks/use-toast';
import {
  PLANNING_TIME_OPTIONS,
  getPlanningTimePrompt,
  normalizePlanningTimeValue,
  type PlanningTimeValue,
} from '@shared/planning';
import {
  MAX_STAPLE_CANDIDATES,
  getAllStapleCandidatesForCuisines,
} from '@shared/planning-staples';
import { mergeUniqueEntries, normalizeEntryKey } from '@/lib/entryParsing';
import { MEAL_PLANNING_STORAGE_KEY, createPlanningProfileFingerprint } from '@/lib/planningCache';
import { ArrowLeft, ChefHat, CheckCircle2, Clock, Plus, RefreshCw, Sparkles, Utensils, X } from 'lucide-react';

const NO_PREFERENCE = 'No preference';

type PlanningStep = 'time' | 'cuisine' | 'staples' | 'tickets' | 'prep-tray';

interface SavedMealPlanningSession {
  currentStep: PlanningStep;
  mealPrefs: MealPreferences;
  selectedStaples: string[];
  seenStapleCandidates: string[];
  recommendations: RecipeRecommendation[];
  selectedMeal: RecipeRecommendation | null;
  savedAt: number;
  profileFingerprint: string;
}

interface LockedStapleView {
  selected: string[];
  visible: string[];
}

interface UserProfile {
  cookingSkill: string;
  dietaryRestrictions: string[];
  pantryIngredients: string[];
  kitchenEquipment: string[];
  favoriteChefs: string[];
}

interface MealPreferences {
  timeAvailable: PlanningTimeValue;
  cuisinePreference: string[];
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
  isFusion?: boolean;
  ingredients?: string[];
  equipment?: string[];
  overview?: string;
  imageUrl?: string;
}

interface RecipeTransformContext {
  pantryIngredients: string[];
  kitchenEquipment: string[];
}

interface MealPlanningProps {
  userProfile: UserProfile;
  sessionScopeKey: string;
  initialTimeAvailable: PlanningTimeValue;
  onPlanningTimeChange: (value: PlanningTimeValue) => void;
  onPantryIngredientsAdded: (ingredients: string[]) => Promise<boolean>;
  onMealSelected: (meal: RecipeRecommendation, scheduledTime: string) => void;
  onEditPantry?: () => void;
  onBackToProfile: () => void;
}

const cuisineOptions = [
  { name: 'Italian', icon: '🍕' },
  { name: 'Mexican', icon: '🌮' },
  { name: 'Korean', icon: '🍲' },
  { name: 'Japanese', icon: '🍣' },
  { name: 'Mediterranean', icon: '🥙' },
  { name: 'Thai', icon: '🍜' },
  { name: 'Indian', icon: '🍛' },
  { name: 'Chinese', icon: '🥟' },
  { name: 'Vietnamese', icon: '🍲' },
  { name: 'American', icon: '🍔' },
  { name: 'French', icon: '🥖' },
  { name: 'Greek', icon: '🫒' },
  { name: 'Middle Eastern', icon: '🧆' },
  { name: 'Spanish', icon: '🥘' },
];

const cuisineNames = new Set(cuisineOptions.map((option) => option.name));
const SELECTED_RECIPE_IMAGE_POLL_DELAY_MS = 5_000;

const isPlanningStep = (value: unknown): value is PlanningStep =>
  value === 'time' || value === 'cuisine' || value === 'staples' || value === 'tickets' || value === 'prep-tray';

const stringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];

const normalizeCuisinePreference = (value: unknown): string[] => {
  const entries = stringArray(value);
  if (entries.includes(NO_PREFERENCE)) return [NO_PREFERENCE];

  const selected = entries.filter((entry, index) =>
    cuisineNames.has(entry) && entries.indexOf(entry) === index
  );

  return selected.length > 0 ? selected : [NO_PREFERENCE];
};

const calculatePantryMatch = (pantryCount: number, additionalCount: number) => {
  if (pantryCount <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round(((pantryCount - additionalCount) / pantryCount) * 100)));
};

const arraysMatch = (left: string[], right: string[]) =>
  left.length === right.length && left.every((item, index) => item === right[index]);

const splitRecipeName = (recipeName: string): { main: string; detail?: string } => {
  const normalized = recipeName.replace(/\s+/g, ' ').trim();
  if (!normalized) return { main: 'Pantry Dinner' };

  const parentheticalMatch = normalized.match(/^(.*?)\s*\(([^()]+)\)\s*$/);
  if (parentheticalMatch) {
    const main = parentheticalMatch[1].trim();
    const detail = parentheticalMatch[2].trim();
    if (main && detail) return { main, detail };
  }

  const colonMatch = normalized.match(/^(.{12,}?):\s*(.{8,})$/);
  if (colonMatch) {
    return {
      main: colonMatch[1].trim(),
      detail: colonMatch[2].trim(),
    };
  }

  return { main: normalized };
};

export default function MealPlanning({
  userProfile,
  sessionScopeKey,
  initialTimeAvailable,
  onPlanningTimeChange,
  onPantryIngredientsAdded,
  onMealSelected,
  onEditPantry,
  onBackToProfile,
}: MealPlanningProps) {
  const [currentStep, setCurrentStep] = useState<PlanningStep>('time');
  const [mealPrefs, setMealPrefs] = useState<MealPreferences>({
    timeAvailable: normalizePlanningTimeValue(initialTimeAvailable),
    cuisinePreference: [NO_PREFERENCE],
  });
  const [selectedStaples, setSelectedStaples] = useState<string[]>([]);
  const [seenStapleCandidates, setSeenStapleCandidates] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<RecipeRecommendation[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<RecipeRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSelectedRecipeImagePending, setIsSelectedRecipeImagePending] = useState(false);
  const [selectedRecipeImageUrlsByRecipeId, setSelectedRecipeImageUrlsByRecipeId] = useState<Record<string, string>>({});
  const [sessionRestored, setSessionRestored] = useState(false);
  const [lockedStapleView, setLockedStapleView] = useState<LockedStapleView | null>(null);
  const [savedStapleHint, setSavedStapleHint] = useState<string | null>(null);
  const generationRunIdRef = useRef(0);
  const activeGenerationRef = useRef<{ runId: number; controller: AbortController } | null>(null);
  const imagePreviewRunIdRef = useRef(0);
  const activeImagePreviewRef = useRef<{ runId: number; controller: AbortController } | null>(null);
  const { toast } = useToast();
  const mealPlanningStorageKey = useMemo(
    () => `${MEAL_PLANNING_STORAGE_KEY}:${sessionScopeKey}`,
    [sessionScopeKey],
  );
  const profileFingerprint = useMemo(
    () => createPlanningProfileFingerprint(userProfile),
    [userProfile],
  );

  const validateSession = (data: any): SavedMealPlanningSession | null => {
    try {
      if (typeof data !== 'object' || data === null) return null;
      if (!isPlanningStep(data.currentStep)) return null;
      if (typeof data.savedAt !== 'number') return null;
      if (data.profileFingerprint !== profileFingerprint) return null;

      const recommendations = Array.isArray(data.recommendations)
        ? data.recommendations.filter((recipe: any) =>
            typeof recipe === 'object' &&
            recipe !== null &&
            typeof recipe.recipeName === 'string'
          ).slice(0, 3).map((recipe: any) => ({ ...recipe, imageUrl: undefined, image_url: undefined }))
        : [];
      const selectedMeal = (
        data.selectedMeal &&
        typeof data.selectedMeal === 'object' &&
        typeof data.selectedMeal.recipeName === 'string'
      ) ? { ...data.selectedMeal, imageUrl: undefined, image_url: undefined } : null;

      return {
        currentStep: data.currentStep,
        mealPrefs: {
          timeAvailable: normalizePlanningTimeValue(data.mealPrefs?.timeAvailable),
          cuisinePreference: normalizeCuisinePreference(data.mealPrefs?.cuisinePreference),
        },
        selectedStaples: stringArray(data.selectedStaples),
        seenStapleCandidates: stringArray(data.seenStapleCandidates),
        recommendations,
        selectedMeal,
        savedAt: data.savedAt,
        profileFingerprint: data.profileFingerprint,
      };
    } catch {
      return null;
    }
  };

  useEffect(() => {
    try {
      localStorage.removeItem(MEAL_PLANNING_STORAGE_KEY);

      const saved = localStorage.getItem(mealPlanningStorageKey);
      if (!saved) return;

      const session = validateSession(JSON.parse(saved));
      if (!session) {
        localStorage.removeItem(mealPlanningStorageKey);
        return;
      }

      const isRecent = Date.now() - session.savedAt < 24 * 60 * 60 * 1000;
      const hasProgress = session.currentStep !== 'time' || session.recommendations.length > 0;

      if (isRecent && hasProgress) {
        setCurrentStep(session.currentStep);
        setMealPrefs(session.mealPrefs);
        setSelectedStaples(session.selectedStaples);
        setSeenStapleCandidates(mergeUniqueEntries(session.seenStapleCandidates, session.selectedStaples));
        setRecommendations(session.recommendations);
        setSelectedMeal(session.selectedMeal);
        setSessionRestored(true);
        onPlanningTimeChange(session.mealPrefs.timeAvailable);
      } else {
        localStorage.removeItem(mealPlanningStorageKey);
      }
    } catch (error) {
      console.error('Error loading saved planning session:', error);
      localStorage.removeItem(mealPlanningStorageKey);
    }
  }, [mealPlanningStorageKey, onPlanningTimeChange, profileFingerprint]);

  useEffect(() => {
    if (sessionRestored) {
      setSessionRestored(false);
      return;
    }

    const hasProgress = currentStep !== 'time' || recommendations.length > 0;
    if (!hasProgress) return;

    const session: SavedMealPlanningSession = {
      currentStep,
      mealPrefs,
      selectedStaples,
      seenStapleCandidates,
      recommendations: recommendations.slice(0, 3),
      selectedMeal,
      savedAt: Date.now(),
      profileFingerprint,
    };

    localStorage.setItem(mealPlanningStorageKey, JSON.stringify(session));
  }, [
    currentStep,
    mealPrefs,
    selectedStaples,
    seenStapleCandidates,
    recommendations,
    selectedMeal,
    sessionRestored,
    mealPlanningStorageKey,
    profileFingerprint,
  ]);

  useEffect(() => {
    if (currentStep !== 'tickets' && currentStep !== 'prep-tray') return;
    if (recommendations.length === 0) return;
    if (selectedMeal && recommendations.some((recipe) => recipe.id === selectedMeal.id)) return;

    setSelectedMeal(recommendations[0]);
  }, [currentStep, recommendations, selectedMeal]);

  useEffect(() => {
    if (currentStep !== 'staples') {
      setSavedStapleHint(null);
    }
  }, [currentStep]);

  const selectedTimeIndex = Math.max(
    0,
    PLANNING_TIME_OPTIONS.findIndex((option) => option.value === mealPrefs.timeAvailable),
  );
  const canProceedFromCuisine = mealPrefs.cuisinePreference.length > 0;
  const fullStapleCandidates = useMemo(
    () => mealPrefs.cuisinePreference.includes(NO_PREFERENCE)
      ? []
      : getAllStapleCandidatesForCuisines(mealPrefs.cuisinePreference, userProfile.pantryIngredients),
    [mealPrefs.cuisinePreference, userProfile.pantryIngredients],
  );
  const visibleStapleCandidates = useMemo(
    () => fullStapleCandidates
      .filter((staple) => !selectedStaples.includes(staple))
      .slice(0, MAX_STAPLE_CANDIDATES),
    [fullStapleCandidates, selectedStaples],
  );
  const pantryIngredientKeys = useMemo(
    () => new Set(userProfile.pantryIngredients.map((ingredient) => normalizeEntryKey(ingredient)).filter(Boolean)),
    [userProfile.pantryIngredients],
  );
  const isSavedPantryStaple = (staple: string) => pantryIngredientKeys.has(normalizeEntryKey(staple));
  const displayedSelectedStaples = lockedStapleView?.selected ?? selectedStaples;
  const displayedStapleCandidates = lockedStapleView?.visible ?? visibleStapleCandidates;
  const showSavedStapleHint = Boolean(
    savedStapleHint &&
      displayedSelectedStaples.includes(savedStapleHint) &&
      isSavedPantryStaple(savedStapleHint),
  );

  const isActiveGeneration = (runId: number, controller: AbortController) =>
    activeGenerationRef.current?.runId === runId && !controller.signal.aborted;

  const isActiveImagePreview = (runId: number, controller: AbortController) =>
    activeImagePreviewRef.current?.runId === runId && !controller.signal.aborted;

  const cancelRecipeImageHydration = ({ resetUi = true }: { resetUi?: boolean } = {}) => {
    const activePreview = activeImagePreviewRef.current;
    if (activePreview) {
      activePreview.controller.abort();
      activeImagePreviewRef.current = null;
      imagePreviewRunIdRef.current += 1;
    }
    if (resetUi) {
      setIsSelectedRecipeImagePending(false);
    }
  };

  const cancelActiveGeneration = ({ resetUi = true }: { resetUi?: boolean } = {}) => {
    const activeGeneration = activeGenerationRef.current;
    if (!activeGeneration) return;

    activeGeneration.controller.abort();
    activeGenerationRef.current = null;
    generationRunIdRef.current += 1;

    if (resetUi) {
      setIsLoading(false);
      setLockedStapleView(null);
    }
  };

  useEffect(() => {
    return () => {
      cancelActiveGeneration({ resetUi: false });
      cancelRecipeImageHydration({ resetUi: false });
    };
  }, []);

  useEffect(() => {
    if (currentStep !== 'staples' || isLoading) return;

    const nextSeenStaples = mergeUniqueEntries(
      seenStapleCandidates,
      [...selectedStaples, ...visibleStapleCandidates],
    );

    if (!arraysMatch(nextSeenStaples, seenStapleCandidates)) {
      setSeenStapleCandidates(nextSeenStaples);
    }
  }, [currentStep, isLoading, selectedStaples, seenStapleCandidates, visibleStapleCandidates]);

  const setPlanningTime = (value: PlanningTimeValue) => {
    setMealPrefs((prev) => ({ ...prev, timeAvailable: value }));
    onPlanningTimeChange(value);
  };

  const toggleCuisine = (cuisine: string) => {
    if (isLoading) return;

    setSavedStapleHint(null);
    setSelectedStaples([]);
    setSeenStapleCandidates([]);
    setMealPrefs((prev) => {
      if (cuisine === NO_PREFERENCE) {
        return {
          ...prev,
          cuisinePreference: [NO_PREFERENCE],
        };
      }

      const withoutNoPreference = prev.cuisinePreference.filter((item) => item !== NO_PREFERENCE);
      const cuisinePreference = withoutNoPreference.includes(cuisine)
        ? withoutNoPreference.filter((item) => item !== cuisine)
        : [...withoutNoPreference, cuisine];

      return {
        ...prev,
        cuisinePreference: cuisinePreference.length > 0 ? cuisinePreference : [NO_PREFERENCE],
      };
    });
  };

  const toggleStaple = (staple: string) => {
    if (isLoading) return;

    setSavedStapleHint(null);
    setSeenStapleCandidates((prev) => mergeUniqueEntries(prev, [staple]));
    setSelectedStaples((prev) =>
      prev.includes(staple)
        ? prev.filter((item) => item !== staple)
        : [...prev, staple]
    );
  };

  const transformRecipe = (
    recipe: any,
    index: number,
    context: RecipeTransformContext = userProfile,
  ): RecipeRecommendation => {
    const additionalIngredientsNeeded = stringArray(recipe.additionalIngredientsNeeded);
    const pantryIngredientsUsed = stringArray(recipe.pantryIngredientsUsed);
    const imageUrl = typeof recipe.imageUrl === 'string'
      ? recipe.imageUrl
      : typeof recipe.image_url === 'string'
        ? recipe.image_url
        : undefined;
    const pantryMatch = typeof recipe.pantryMatch === 'number'
      ? recipe.pantryMatch
      : calculatePantryMatch(context.pantryIngredients.length, additionalIngredientsNeeded.length);

    return {
      id: `recipe-${Date.now()}-${index}`,
      recipeName: typeof recipe.recipeName === 'string' ? recipe.recipeName : 'Pantry Dinner',
      description: typeof recipe.description === 'string'
        ? recipe.description
        : 'A pantry-first idea shaped around what you have.',
      cookTime: typeof recipe.cookTime === 'number' ? recipe.cookTime : 30,
      difficulty: typeof recipe.difficulty === 'string' ? recipe.difficulty : 'Medium',
      cuisine: typeof recipe.cuisine === 'string' ? recipe.cuisine : 'Pantry-first',
      pantryMatch,
      missingIngredients: additionalIngredientsNeeded,
      isFusion: Boolean(recipe.isFusion),
      ingredients: pantryIngredientsUsed.length > 0
        ? pantryIngredientsUsed
        : context.pantryIngredients.slice(0, 6),
      equipment: context.kitchenEquipment,
      overview: typeof recipe.overview === 'string' ? recipe.overview : undefined,
      imageUrl,
    };
  };

  const stripRecipeImages = (recipes: RecipeRecommendation[]): RecipeRecommendation[] =>
    recipes.map((recipe) => ({ ...recipe, imageUrl: undefined }));

  const buildRecipeImageResolverPayload = (recipe: RecipeRecommendation) => ({
    recipeName: recipe.recipeName,
    cuisine: recipe.cuisine,
    pantryIngredientsUsed: recipe.ingredients || [],
    ingredients: recipe.ingredients || [],
    additionalIngredientsNeeded: recipe.missingIngredients,
    missingIngredients: recipe.missingIngredients,
    overview: recipe.overview,
    description: recipe.description,
  });

  const waitForRecipeImagePoll = (signal: AbortSignal, delayMs = SELECTED_RECIPE_IMAGE_POLL_DELAY_MS) =>
    new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        signal.removeEventListener('abort', abort);
        resolve();
      }, delayMs);
      const abort = () => {
        window.clearTimeout(timeout);
        reject(new DOMException('Recipe image hydration canceled', 'AbortError'));
      };

      signal.addEventListener('abort', abort, { once: true });
    });

  const waitForResolvedSelectedRecipeImage = async (
    recipe: RecipeRecommendation,
    controller: AbortController,
    {
      delayMs,
      isStillActive,
    }: {
      delayMs: number;
      isStillActive: () => boolean;
    },
  ): Promise<{ imageUrl: string } | null> => {
    const resolverRecipe = buildRecipeImageResolverPayload(recipe);
    while (isStillActive()) {
      const result = await resolveSelectedRecipeImage(resolverRecipe, { signal: controller.signal });
      if (!isStillActive()) return null;

      if (result.status === 'ready') {
        return { imageUrl: result.image.imageUrl };
      }

      if (result.status === 'unavailable') {
        return null;
      }

      await waitForRecipeImagePoll(controller.signal, delayMs);
    }

    return null;
  };

  const applyResolvedSelectedRecipeImage = (
    recipeSnapshot: RecipeRecommendation,
    image: { imageUrl: string },
  ) => {
    setSelectedRecipeImageUrlsByRecipeId((currentImages) => ({
      ...currentImages,
      [recipeSnapshot.id]: image.imageUrl,
    }));
  };

  const hydrateSelectedRecipeImage = (recipe: RecipeRecommendation) => {
    if (selectedRecipeImageUrlsByRecipeId[recipe.id]) return;

    cancelRecipeImageHydration();
    const controller = new AbortController();
    const runId = imagePreviewRunIdRef.current + 1;
    imagePreviewRunIdRef.current = runId;
    activeImagePreviewRef.current = { runId, controller };
    setIsSelectedRecipeImagePending(true);

    void (async () => {
      try {
        const image = await waitForResolvedSelectedRecipeImage(recipe, controller, {
          delayMs: SELECTED_RECIPE_IMAGE_POLL_DELAY_MS,
          isStillActive: () => isActiveImagePreview(runId, controller),
        });
        if (image) {
          applyResolvedSelectedRecipeImage(recipe, image);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.warn('Selected recipe image preview unavailable:', error);
        }
      } finally {
        if (activeImagePreviewRef.current?.runId === runId) {
          activeImagePreviewRef.current = null;
          setIsSelectedRecipeImagePending(false);
        }
      }
    })();
  };

  useEffect(() => {
    if (currentStep !== 'prep-tray') return;
    if (!selectedMeal || selectedRecipeImageUrlsByRecipeId[selectedMeal.id]) return;

    hydrateSelectedRecipeImage(selectedMeal);
  }, [currentStep, selectedMeal?.id, selectedRecipeImageUrlsByRecipeId]);

  const generateRecommendations = async ({
    confirmedStaples = [],
    askedStaples = [],
    visibleStaples = [],
  }: {
    confirmedStaples?: string[];
    askedStaples?: string[];
    visibleStaples?: string[];
  } = {}) => {
    if (activeGenerationRef.current) return;
    cancelRecipeImageHydration();

    const requestMealPrefs = {
      timeAvailable: mealPrefs.timeAvailable,
      cuisinePreference: [...mealPrefs.cuisinePreference],
    };
    const requestProfile = {
      ...userProfile,
      dietaryRestrictions: [...userProfile.dietaryRestrictions],
      pantryIngredients: [...userProfile.pantryIngredients],
      kitchenEquipment: [...userProfile.kitchenEquipment],
      favoriteChefs: [...userProfile.favoriteChefs],
    };
    const requestPreviousRecommendations = recommendations.slice(0, 3);
    const requestConfirmedStaples = mergeUniqueEntries([], confirmedStaples);
    const requestAskedStaples = mergeUniqueEntries([], askedStaples);
    const requestVisibleStaples = mergeUniqueEntries([], visibleStaples)
      .filter((staple) => !requestConfirmedStaples.includes(staple));
    const requestPantryKeys = new Set(requestProfile.pantryIngredients.map((ingredient) => normalizeEntryKey(ingredient)).filter(Boolean));
    const requestUnsavedConfirmedStaples = requestConfirmedStaples
      .filter((staple) => !requestPantryKeys.has(normalizeEntryKey(staple)));
    const controller = new AbortController();
    const runId = generationRunIdRef.current + 1;

    if (!requestProfile.pantryIngredients || requestProfile.pantryIngredients.length === 0) {
      toast({
        title: 'Your pantry is empty',
        description: 'Add or scan pantry items before I can suggest recipes.',
        action: onEditPantry ? (
          <ToastAction altText="Open Pantry Settings" onClick={onEditPantry}>
            Add pantry
          </ToastAction>
        ) : undefined,
        variant: 'destructive',
      });
      return;
    }

    if (!requestProfile.cookingSkill) {
      toast({
        title: 'Profile Incomplete',
        description: 'Please complete your cooking profile before getting meal recommendations.',
        variant: 'destructive',
      });
      return;
    }

    generationRunIdRef.current = runId;
    activeGenerationRef.current = { runId, controller };
    setLockedStapleView(
      requestAskedStaples.length > 0 || requestConfirmedStaples.length > 0
        ? { selected: requestConfirmedStaples, visible: requestVisibleStaples }
        : null
    );
    setIsLoading(true);

    let pantryIngredientsForRequest = requestProfile.pantryIngredients;
    if (requestConfirmedStaples.length > 0) {
      pantryIngredientsForRequest = mergeUniqueEntries(requestProfile.pantryIngredients, requestConfirmedStaples);
    }

    if (requestUnsavedConfirmedStaples.length > 0) {
      try {
        const saved = await onPantryIngredientsAdded(requestUnsavedConfirmedStaples);
        if (!isActiveGeneration(runId, controller)) return;

        if (!saved) {
          toast({
            title: "Couldn't save pantry staples",
            description: "We'll still use them for these recipes. You can add them later in Settings.",
            variant: 'destructive',
          });
        }
      } catch {
        if (!isActiveGeneration(runId, controller)) return;

        toast({
          title: "Couldn't save pantry staples",
          description: "We'll still use them for these recipes. You can add them later in Settings.",
          variant: 'destructive',
        });
      }
    }

    const unconfirmedStaples = requestAskedStaples.filter((staple) => !requestConfirmedStaples.includes(staple));

    try {
      const result = await withAiErrorHandling(async () => {
        const preferenceParts = [
          `Time available: ${getPlanningTimePrompt(requestMealPrefs.timeAvailable)}`,
          `Cooking skill: ${requestProfile.cookingSkill}`,
          'Use pantry ingredients first; optional extras must be nonessential and capped at 3',
          'Each recipe must still work if optional extras are skipped',
          "Return a quiet range: pantry-strict, pantry-flexible, cuisine-leaning; don't label tiers",
        ];

        if (!requestMealPrefs.cuisinePreference.includes(NO_PREFERENCE)) {
          preferenceParts.push(`Preferred cuisines: ${requestMealPrefs.cuisinePreference.join(', ')}`);
        }

        if (requestConfirmedStaples.length > 0) {
          preferenceParts.push(`Confirmed staples: ${requestConfirmedStaples.join(', ')}`);
        }

        if (unconfirmedStaples.length > 0) {
          preferenceParts.push(`Unconfirmed staples: ${unconfirmedStaples.join(', ')}; do not assume`);
        }

        if (requestProfile.dietaryRestrictions.length > 0) {
          preferenceParts.push(`Dietary restrictions: ${requestProfile.dietaryRestrictions.join(', ')}`);
        }

        if (requestPreviousRecommendations.length > 0) {
          preferenceParts.push(`Please suggest a fresh set, not: ${requestPreviousRecommendations.map((recipe) => recipe.recipeName).join(', ')}`);
        }

        const recipeResponse = await fetchPantryRecipes(
          pantryIngredientsForRequest,
          preferenceParts.join('. '),
          getPlanningTimePrompt(requestMealPrefs.timeAvailable),
          { signal: controller.signal },
        );

        if (!isActiveGeneration(runId, controller)) return null;

        const recipes: RecipeRecommendation[] = Array.isArray(recipeResponse.recipes)
          ? recipeResponse.recipes.slice(0, 3).map((recipe: any, index: number) =>
              transformRecipe(recipe, index, {
                pantryIngredients: pantryIngredientsForRequest,
                kitchenEquipment: requestProfile.kitchenEquipment,
              })
            )
          : [];

        if (recipes.length !== 3) {
          throw new Error('Expected exactly three recipe suggestions');
        }

        if (!isActiveGeneration(runId, controller)) return null;

        return stripRecipeImages(recipes);
      }, { context: 'meal recommendations' });

      if (result && isActiveGeneration(runId, controller)) {
        setSelectedRecipeImageUrlsByRecipeId({});
        setRecommendations(result);
        setSelectedMeal(result[0]);
        setCurrentStep('tickets');
      }
    } finally {
      if (activeGenerationRef.current?.runId === runId) {
        activeGenerationRef.current = null;
        setIsLoading(false);
        setLockedStapleView(null);
      }
    }
  };

  const continueFromCuisine = () => {
    setSelectedStaples([]);
    setSeenStapleCandidates([]);
    if (fullStapleCandidates.length > 0) {
      setCurrentStep('staples');
      return;
    }

    generateRecommendations();
  };

  const continueFromStaples = () => {
    const submittedSeenStaples = mergeUniqueEntries(
      seenStapleCandidates,
      [...selectedStaples, ...visibleStapleCandidates],
    );

    generateRecommendations({
      confirmedStaples: selectedStaples,
      askedStaples: submittedSeenStaples,
      visibleStaples: visibleStapleCandidates,
    });
  };

  const handleMealSelected = (meal: RecipeRecommendation) => {
    cancelRecipeImageHydration();
    localStorage.removeItem(mealPlanningStorageKey);
    onMealSelected(meal, 'now');
  };

  const handleBack = () => {
    cancelActiveGeneration();
    cancelRecipeImageHydration();

    if (currentStep === 'time') {
      onBackToProfile();
      return;
    }
    if (currentStep === 'cuisine') {
      setCurrentStep('time');
      return;
    }
    if (currentStep === 'staples') {
      setCurrentStep('cuisine');
      return;
    }
    if (currentStep === 'prep-tray') {
      setCurrentStep('tickets');
      return;
    }
    setCurrentStep(
      displayedStapleCandidates.length > 0 || displayedSelectedStaples.length > 0
        ? 'staples'
        : 'cuisine'
    );
  };

  const renderTimeStep = () => (
    <section className="planning-screen mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-md flex-col px-4 pb-4 pt-8">
      <button type="button" className="planning-back-button mb-8" onClick={handleBack} aria-label="Back to planning choices">
        <ArrowLeft className="h-5 w-5" />
      </button>

      <div className="flex flex-1 flex-col justify-center gap-10">
        <div className="text-center">
          <h1 className="planning-display text-3xl font-extrabold leading-tight">
            How much time do you have today?
          </h1>
          <p className="planning-copy mt-3 text-sm font-bold">Including cleanup</p>
        </div>

        <div className="planning-clock mx-auto" aria-hidden="true">
          <Clock className="h-20 w-20" />
        </div>

        <div className="planning-slider-card">
          <div className="planning-slider-track">
            <Slider
              value={[selectedTimeIndex]}
              min={0}
              max={PLANNING_TIME_OPTIONS.length - 1}
              step={1}
              onValueChange={(value) => {
                const option = PLANNING_TIME_OPTIONS[value[0]] ?? PLANNING_TIME_OPTIONS[0];
                setPlanningTime(option.value);
              }}
              aria-label="Planning time"
            />
          </div>
          <div className="planning-time-label-grid mt-5">
            {PLANNING_TIME_OPTIONS.map((option) => (
              <button
                type="button"
                key={option.value}
                className="planning-time-label"
                data-active={mealPrefs.timeAvailable === option.value}
                onClick={() => setPlanningTime(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="planning-note">
          <Clock className="h-5 w-5" />
          <span>We&apos;ll find recipes that fit within your time.</span>
        </div>
      </div>

      <Button className="mt-6 h-12 rounded-xl font-extrabold" onClick={() => setCurrentStep('cuisine')}>
        Next
      </Button>
    </section>
  );

  const renderCuisineStep = () => (
    <section className="planning-screen planning-cuisine-screen mx-auto min-h-[calc(100vh-6rem)] w-full max-w-md px-4 pb-4 pt-8">
      <button type="button" className="planning-back-button mb-8" onClick={handleBack} aria-label="Back to time">
        <ArrowLeft className="h-5 w-5" />
      </button>

      <div className="text-center">
        <h1 className="planning-display text-3xl font-extrabold leading-tight">What sounds good?</h1>
        <p className="planning-copy mt-3 text-sm font-bold">Pick as many as you like</p>
      </div>

      <div className="planning-cuisine-scroll mt-8" aria-label="Cuisine options">
        <div className="space-y-3 pb-3">
          {cuisineOptions.map((cuisine) => {
            const selected = mealPrefs.cuisinePreference.includes(cuisine.name);
            return (
              <button
                type="button"
                key={cuisine.name}
                className="planning-cuisine-row"
                data-selected={selected}
                disabled={isLoading}
                onClick={() => toggleCuisine(cuisine.name)}
              >
                <span className="planning-cuisine-icon" aria-hidden="true">{cuisine.icon}</span>
                <span className="min-w-0 flex-1 text-left">{cuisine.name}</span>
                <span className="planning-cuisine-check" aria-hidden="true">
                  {selected && <CheckCircle2 className="h-5 w-5" />}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="planning-cuisine-actions">
        <button
          type="button"
          className="planning-no-preference"
          data-selected={mealPrefs.cuisinePreference.includes(NO_PREFERENCE)}
          disabled={isLoading}
          onClick={() => toggleCuisine(NO_PREFERENCE)}
        >
          <Sparkles className="h-5 w-5" aria-hidden="true" />
          <span>No preference</span>
        </button>

        <Button
          className="mt-4 h-12 w-full rounded-xl font-extrabold"
          onClick={continueFromCuisine}
          disabled={!canProceedFromCuisine || isLoading}
        >
          {isLoading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Finding recipes...
            </>
          ) : (
            'View recipe suggestions'
          )}
        </Button>
      </div>
    </section>
  );

  const renderStaplesStep = () => (
    <section className="planning-screen planning-cuisine-screen mx-auto min-h-[calc(100vh-6rem)] w-full max-w-md px-4 pb-4 pt-8">
      <button type="button" className="planning-back-button mb-8" onClick={handleBack} aria-label="Back to cuisines">
        <ArrowLeft className="h-5 w-5" />
      </button>

      <div className="text-center">
        <h1 className="planning-display text-3xl font-extrabold leading-tight">Anything else around?</h1>
        <p className="planning-copy mt-3 text-sm font-bold">
          Tap what you have. We&apos;ll save additions when you view suggestions.
        </p>
      </div>

      {displayedSelectedStaples.length > 0 && (
        <div className="planning-added-shelf mt-8" role="group" aria-label="Added pantry staples">
          <p className="planning-added-label">Added</p>
          <div className="planning-added-chip-row">
            {displayedSelectedStaples.map((staple) => {
              const savedToPantry = isSavedPantryStaple(staple);

              if (savedToPantry) {
                return (
                  <button
                    type="button"
                    key={staple}
                    className="planning-added-chip planning-added-chip-saved"
                    aria-label={`Already saved in your pantry: ${staple}. Head to Pantry Settings to make changes.`}
                    onClick={() => setSavedStapleHint(staple)}
                  >
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    <span className="planning-added-chip-text">{staple}</span>
                  </button>
                );
              }

              return (
                <button
                  type="button"
                  key={staple}
                  className="planning-added-chip"
                  aria-label={`Remove ${staple} from Added`}
                  disabled={isLoading}
                  onClick={() => toggleStaple(staple)}
                >
                  <Plus className="planning-added-chip-add h-4 w-4" aria-hidden="true" />
                  <span className="planning-added-chip-text">{staple}</span>
                  <X className="planning-added-chip-remove h-3.5 w-3.5" aria-hidden="true" />
                </button>
              );
            })}
          </div>
          {showSavedStapleHint && (
            <p className="planning-added-help" role="status">
              These are already saved in your pantry. Head to Pantry Settings to make changes.
            </p>
          )}
        </div>
      )}

      <div
        className={displayedSelectedStaples.length > 0 ? 'mt-5 space-y-3' : 'mt-8 space-y-3'}
        role="group"
        aria-label="Pantry staple options"
      >
        {displayedStapleCandidates.map((staple) => {
          const selected = selectedStaples.includes(staple);
          return (
            <button
              type="button"
              key={staple}
              className="planning-cuisine-row planning-staple-row"
              data-selected={selected}
              aria-pressed={selected}
              disabled={isLoading}
              onClick={() => toggleStaple(staple)}
            >
              <span className="planning-cuisine-icon" aria-hidden="true">+</span>
              <span className="min-w-0 flex-1 text-left">{staple}</span>
              <span className="planning-cuisine-check" aria-hidden="true">
                {selected && <CheckCircle2 className="h-5 w-5" />}
              </span>
            </button>
          );
        })}
      </div>

      <div className="planning-cuisine-actions">
        <Button
          className="h-12 w-full rounded-xl font-extrabold"
          onClick={continueFromStaples}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Finding recipes...
            </>
          ) : (
            'View recipe suggestions'
          )}
        </Button>
      </div>
    </section>
  );

  const renderRecipeImageSlot = (
    recipe: RecipeRecommendation,
    variant: 'ticket' | 'prep' = 'ticket',
    isGeneratingPreview = false,
  ) => (
    <span
      className={`planning-recipe-image-slot ${variant === 'prep' ? 'planning-recipe-image-slot-prep' : ''}`}
      data-has-image={Boolean(recipe.imageUrl)}
      data-image-state={recipe.imageUrl ? 'ready' : isGeneratingPreview ? 'pending' : 'placeholder'}
      aria-hidden="true"
    >
      {recipe.imageUrl ? (
        <img src={recipe.imageUrl} alt="" className="planning-recipe-image" />
      ) : (
        <>
          <span className="planning-recipe-image-plate" />
          <Utensils className="planning-recipe-image-icon" />
          {isGeneratingPreview && (
            <span className="planning-recipe-image-spinner" />
          )}
        </>
      )}
    </span>
  );

  const renderRecipeTicketTitle = (recipeName: string) => {
    const { main, detail } = splitRecipeName(recipeName);

    return (
      <span className="planning-ticket-title">
        <span className="planning-ticket-title-main">{main}</span>
        {detail && <span className="planning-ticket-title-detail">{detail}</span>}
      </span>
    );
  };

  const renderTicket = (recipe: RecipeRecommendation, isLarge = false) => {
    const selected = selectedMeal?.id === recipe.id;

    return (
      <button
        type="button"
        key={recipe.id}
        className={isLarge ? 'planning-ticket planning-ticket-large' : 'planning-ticket planning-ticket-row'}
        data-selected={selected}
        aria-pressed={selected}
        onClick={() => setSelectedMeal(recipe)}
      >
        <span className="planning-ticket-rip" aria-hidden="true" />
        {renderRecipeTicketTitle(recipe.recipeName)}
        {renderRecipeImageSlot({ ...recipe, imageUrl: undefined })}
        <span className="planning-ticket-meta">
          <span><Clock className="h-4 w-4" /> {recipe.cookTime} min</span>
          <span>{recipe.difficulty}</span>
        </span>
        {isLarge && (
          <>
            <span className="planning-ticket-divider" />
            <span className="planning-ticket-section">
              <span className="planning-ticket-section-label">Uses</span>
              <span className="planning-ticket-chip-row">
                {(recipe.ingredients || []).slice(0, 5).map((ingredient) => (
                  <Badge key={ingredient} variant="outline" className="planning-use-chip">
                    {ingredient}
                  </Badge>
                ))}
              </span>
            </span>
            {recipe.missingIngredients.length > 0 && (
              <span className="planning-ticket-optional">
                <span>Optional:</span> {recipe.missingIngredients.slice(0, 3).join(', ')}
              </span>
            )}
          </>
        )}
      </button>
    );
  };

  const renderTicketsStep = () => {
    const visibleRecommendations = recommendations.slice(0, 3);
    const selectedMealId = selectedMeal?.id ?? visibleRecommendations[0]?.id;

    return (
      <section className="planning-screen mx-auto min-h-[calc(100vh-6rem)] w-full max-w-md px-4 pb-4 pt-8">
        <button type="button" className="planning-back-button mb-6" onClick={handleBack} aria-label="Back to cuisines">
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="text-center">
          <h1 className="planning-display text-3xl font-extrabold leading-tight">
            Recipe suggestions from your pantry
          </h1>
          <Utensils className="mx-auto mt-3 h-5 w-5 text-primary" aria-hidden="true" />
        </div>

        <div className="planning-ticket-stack mt-7">
          {visibleRecommendations.map((recipe) => renderTicket(recipe, recipe.id === selectedMealId))}
        </div>

        <div className="mt-6 space-y-3">
          <Button
            className="h-12 w-full rounded-xl font-extrabold"
            disabled={!selectedMeal || isLoading}
            onClick={() => setCurrentStep('prep-tray')}
          >
            <ChefHat className="h-5 w-5" />
            View prep tray
          </Button>
          <Button
            variant="outline"
            className="h-12 w-full rounded-xl font-extrabold"
            disabled={isLoading}
            onClick={() => generateRecommendations()}
          >
            {isLoading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                Finding recipes...
              </>
            ) : (
              <>
                <RefreshCw className="h-5 w-5" />
                Refresh suggestions
              </>
            )}
          </Button>
        </div>
      </section>
    );
  };

  const renderPrepTray = () => {
    if (!selectedMeal) {
      return (
        <section className="planning-screen mx-auto min-h-[calc(100vh-6rem)] w-full max-w-md px-4 pb-4 pt-8">
          <button type="button" className="planning-back-button mb-6" onClick={handleBack} aria-label="Back to recipe suggestions">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="planning-note">
            <ChefHat className="h-5 w-5" />
            <span>Choose one ticket before opening the prep tray.</span>
          </div>
        </section>
      );
    }

    const selectedPrepTrayImageUrl = selectedRecipeImageUrlsByRecipeId[selectedMeal.id];
    const selectedMealWithPrepImage = selectedPrepTrayImageUrl
      ? { ...selectedMeal, imageUrl: selectedPrepTrayImageUrl }
      : selectedMeal;

    return (
      <section className="planning-screen mx-auto min-h-[calc(100vh-6rem)] w-full max-w-md px-4 pb-4 pt-8">
        <button type="button" className="planning-back-button mb-6" onClick={handleBack} aria-label="Back to recipe suggestions">
          <ArrowLeft className="h-5 w-5" />
        </button>

        {/* design:tone-override — Prep Tray is the Phase 3 tactile ticket-detail object, not a generic recipe card. */}
        <div className="planning-prep-tray">
          <div className="planning-prep-hero">
            {renderRecipeImageSlot(selectedMealWithPrepImage, 'prep', isSelectedRecipeImagePending)}
          </div>
          <div className="planning-prep-body">
            <h1 className="planning-display text-3xl font-extrabold leading-tight">{selectedMeal.recipeName}</h1>
            <p className="planning-ticket-meta mt-3">
              <span><Clock className="h-4 w-4" /> {selectedMeal.cookTime} min</span>
              <span>{selectedMeal.difficulty}</span>
            </p>

            {selectedMeal.description && (
              <p className="planning-copy mt-4 text-sm font-bold">{selectedMeal.description}</p>
            )}

            <div className="planning-prep-section mt-5">
              <p className="planning-prep-label">Use these</p>
              <div className="planning-ticket-chip-row mt-2">
                {(selectedMeal.ingredients || []).map((ingredient) => (
                  <Badge key={ingredient} variant="outline" className="planning-use-chip">
                    {ingredient}
                  </Badge>
                ))}
              </div>
            </div>

            {selectedMeal.missingIngredients.length > 0 && (
              <div className="planning-prep-section planning-prep-optional mt-4">
                <p className="planning-prep-label">Optional if around</p>
                <div className="planning-ticket-chip-row mt-2">
                  {selectedMeal.missingIngredients.map((ingredient) => (
                    <Badge key={ingredient} variant="outline" className="planning-optional-chip">
                      {ingredient}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <Button className="mt-5 h-12 w-full rounded-xl font-extrabold" onClick={() => handleMealSelected(selectedMeal)}>
          <ChefHat className="h-5 w-5" />
          Cook this
        </Button>
      </section>
    );
  };

  if (currentStep === 'time') return renderTimeStep();
  if (currentStep === 'cuisine') return renderCuisineStep();
  if (currentStep === 'staples') return renderStaplesStep();
  if (currentStep === 'tickets') return renderTicketsStep();
  return renderPrepTray();
}
