import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { fetchPantryRecipes } from '@/lib/openai';
import { withDemoErrorHandling } from '@/lib/rateLimitHandler';
import { useToast } from '@/hooks/use-toast';
import laicaLogo from '@assets/laica_logo_v1_cropped_1763444931884.png';
import {
  PLANNING_TIME_OPTIONS,
  getPlanningTimePrompt,
  normalizePlanningTimeValue,
  type PlanningTimeValue,
} from '@shared/planning';
import { ArrowLeft, ChefHat, CheckCircle2, Clock, RefreshCw, Sparkles, Utensils } from 'lucide-react';

const MEAL_PLANNING_STORAGE_KEY = 'laica_meal_planning_session_v2';
const NO_PREFERENCE = 'No preference';

type PlanningStep = 'time' | 'cuisine' | 'tickets' | 'prep-tray';

interface SavedMealPlanningSession {
  currentStep: PlanningStep;
  mealPrefs: MealPreferences;
  recommendations: RecipeRecommendation[];
  selectedMeal: RecipeRecommendation | null;
  savedAt: number;
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
}

interface MealPlanningProps {
  userProfile: UserProfile;
  initialTimeAvailable: PlanningTimeValue;
  onPlanningTimeChange: (value: PlanningTimeValue) => void;
  onMealSelected: (meal: RecipeRecommendation, scheduledTime: string) => void;
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

const isPlanningStep = (value: unknown): value is PlanningStep =>
  value === 'time' || value === 'cuisine' || value === 'tickets' || value === 'prep-tray';

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

export default function MealPlanning({
  userProfile,
  initialTimeAvailable,
  onPlanningTimeChange,
  onMealSelected,
  onBackToProfile,
}: MealPlanningProps) {
  const [currentStep, setCurrentStep] = useState<PlanningStep>('time');
  const [mealPrefs, setMealPrefs] = useState<MealPreferences>({
    timeAvailable: normalizePlanningTimeValue(initialTimeAvailable),
    cuisinePreference: [NO_PREFERENCE],
  });
  const [recommendations, setRecommendations] = useState<RecipeRecommendation[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<RecipeRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionRestored, setSessionRestored] = useState(false);
  const { toast } = useToast();

  const validateSession = (data: any): SavedMealPlanningSession | null => {
    try {
      if (typeof data !== 'object' || data === null) return null;
      if (!isPlanningStep(data.currentStep)) return null;
      if (typeof data.savedAt !== 'number') return null;

      const recommendations = Array.isArray(data.recommendations)
        ? data.recommendations.filter((recipe: any) =>
            typeof recipe === 'object' &&
            recipe !== null &&
            typeof recipe.recipeName === 'string'
          ).slice(0, 3)
        : [];
      const selectedMeal = (
        data.selectedMeal &&
        typeof data.selectedMeal === 'object' &&
        typeof data.selectedMeal.recipeName === 'string'
      ) ? data.selectedMeal : null;

      return {
        currentStep: data.currentStep,
        mealPrefs: {
          timeAvailable: normalizePlanningTimeValue(data.mealPrefs?.timeAvailable),
          cuisinePreference: normalizeCuisinePreference(data.mealPrefs?.cuisinePreference),
        },
        recommendations,
        selectedMeal,
        savedAt: data.savedAt,
      };
    } catch {
      return null;
    }
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem(MEAL_PLANNING_STORAGE_KEY);
      if (!saved) return;

      const session = validateSession(JSON.parse(saved));
      if (!session) {
        localStorage.removeItem(MEAL_PLANNING_STORAGE_KEY);
        return;
      }

      const isRecent = Date.now() - session.savedAt < 24 * 60 * 60 * 1000;
      const hasProgress = session.currentStep !== 'time' || session.recommendations.length > 0;

      if (isRecent && hasProgress) {
        setCurrentStep(session.currentStep);
        setMealPrefs(session.mealPrefs);
        setRecommendations(session.recommendations);
        setSelectedMeal(session.selectedMeal);
        setSessionRestored(true);
        onPlanningTimeChange(session.mealPrefs.timeAvailable);
      } else {
        localStorage.removeItem(MEAL_PLANNING_STORAGE_KEY);
      }
    } catch (error) {
      console.error('Error loading saved planning session:', error);
      localStorage.removeItem(MEAL_PLANNING_STORAGE_KEY);
    }
  }, [onPlanningTimeChange]);

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
      recommendations: recommendations.slice(0, 3),
      selectedMeal,
      savedAt: Date.now(),
    };

    localStorage.setItem(MEAL_PLANNING_STORAGE_KEY, JSON.stringify(session));
  }, [currentStep, mealPrefs, recommendations, selectedMeal, sessionRestored]);

  const selectedTimeIndex = Math.max(
    0,
    PLANNING_TIME_OPTIONS.findIndex((option) => option.value === mealPrefs.timeAvailable),
  );
  const canProceedFromCuisine = mealPrefs.cuisinePreference.length > 0;

  const setPlanningTime = (value: PlanningTimeValue) => {
    setMealPrefs((prev) => ({ ...prev, timeAvailable: value }));
    onPlanningTimeChange(value);
  };

  const toggleCuisine = (cuisine: string) => {
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

  const transformRecipe = (recipe: any, index: number): RecipeRecommendation => {
    const additionalIngredientsNeeded = stringArray(recipe.additionalIngredientsNeeded);
    const pantryIngredientsUsed = stringArray(recipe.pantryIngredientsUsed);
    const pantryMatch = typeof recipe.pantryMatch === 'number'
      ? recipe.pantryMatch
      : calculatePantryMatch(userProfile.pantryIngredients.length, additionalIngredientsNeeded.length);

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
        : userProfile.pantryIngredients.slice(0, 6),
      equipment: userProfile.kitchenEquipment,
      overview: typeof recipe.overview === 'string' ? recipe.overview : undefined,
    };
  };

  const generateRecommendations = async () => {
    if (!userProfile.pantryIngredients || userProfile.pantryIngredients.length === 0) {
      toast({
        title: 'Profile Incomplete',
        description: 'Please add pantry ingredients to your profile before getting meal recommendations.',
        variant: 'destructive',
      });
      return;
    }

    if (!userProfile.cookingSkill) {
      toast({
        title: 'Profile Incomplete',
        description: 'Please complete your cooking profile before getting meal recommendations.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    const result = await withDemoErrorHandling(async () => {
      const preferenceParts = [
        `Time available: ${getPlanningTimePrompt(mealPrefs.timeAvailable)}`,
        `Cooking skill: ${userProfile.cookingSkill}`,
        'Use pantry ingredients first and treat extra ingredients as optional enhancements only when useful',
      ];

      if (!mealPrefs.cuisinePreference.includes(NO_PREFERENCE)) {
        preferenceParts.push(`Preferred cuisines: ${mealPrefs.cuisinePreference.join(', ')}`);
      }

      if (userProfile.dietaryRestrictions.length > 0) {
        preferenceParts.push(`Dietary restrictions: ${userProfile.dietaryRestrictions.join(', ')}`);
      }

      if (recommendations.length > 0) {
        preferenceParts.push(`Please suggest a fresh set, not: ${recommendations.map((recipe) => recipe.recipeName).join(', ')}`);
      }

      const recipeResponse = await fetchPantryRecipes(
        userProfile.pantryIngredients,
        preferenceParts.join('. '),
        getPlanningTimePrompt(mealPrefs.timeAvailable),
      );

      const recipes = Array.isArray(recipeResponse.recipes)
        ? recipeResponse.recipes.slice(0, 3).map(transformRecipe)
        : [];

      if (recipes.length !== 3) {
        throw new Error('Expected exactly three recipe suggestions');
      }

      return recipes;
    }, 'meal recommendations');

    if (result) {
      setRecommendations(result);
      setSelectedMeal(result[0]);
      setCurrentStep('tickets');
    }

    setIsLoading(false);
  };

  const handleMealSelected = (meal: RecipeRecommendation) => {
    localStorage.removeItem(MEAL_PLANNING_STORAGE_KEY);
    onMealSelected(meal, 'now');
  };

  const handleBack = () => {
    if (currentStep === 'time') {
      onBackToProfile();
      return;
    }
    if (currentStep === 'cuisine') {
      setCurrentStep('time');
      return;
    }
    if (currentStep === 'prep-tray') {
      setCurrentStep('tickets');
      return;
    }
    setCurrentStep('cuisine');
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
          onClick={() => toggleCuisine(NO_PREFERENCE)}
        >
          <Sparkles className="h-5 w-5" aria-hidden="true" />
          <span>No preference</span>
        </button>

        <Button
          className="mt-4 h-12 w-full rounded-xl font-extrabold"
          onClick={generateRecommendations}
          disabled={!canProceedFromCuisine || isLoading}
        >
          {isLoading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Making three ideas...
            </>
          ) : (
            'Show me three ideas'
          )}
        </Button>
      </div>
    </section>
  );

  const renderTicket = (recipe: RecipeRecommendation, index: number, isLarge = false) => {
    const selected = selectedMeal?.id === recipe.id;

    return (
      <button
        type="button"
        key={recipe.id}
        className={isLarge ? 'planning-ticket planning-ticket-large' : 'planning-ticket planning-ticket-row'}
        data-selected={selected}
        onClick={() => setSelectedMeal(recipe)}
      >
        <span className="planning-ticket-rip" aria-hidden="true" />
        <span className="planning-ticket-rank">
          <ChefHat className="h-4 w-4" />
          #{index + 1}
        </span>
        <span className="planning-ticket-title">{recipe.recipeName}</span>
        {isLarge && (
          <span className="planning-ticket-illustration" aria-hidden="true">🍜</span>
        )}
        <span className="planning-ticket-meta">
          <span><Clock className="h-4 w-4" /> {recipe.cookTime} min</span>
          <span>{recipe.difficulty}</span>
        </span>
        <span className="planning-ticket-divider" />
        <span className="planning-ticket-section">
          <span className="planning-ticket-section-label">Uses</span>
          <span className="planning-ticket-chip-row">
            {(recipe.ingredients || []).slice(0, isLarge ? 5 : 3).map((ingredient) => (
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
      </button>
    );
  };

  const renderTicketsStep = () => {
    const visibleRecommendations = recommendations.slice(0, 3);
    const featuredRecipe = selectedMeal ?? visibleRecommendations[0] ?? null;
    const sideRecipes = visibleRecommendations.filter((recipe) => recipe.id !== featuredRecipe?.id);

    return (
      <section className="planning-screen mx-auto min-h-[calc(100vh-6rem)] w-full max-w-md px-4 pb-4 pt-8">
        <button type="button" className="planning-back-button mb-6" onClick={handleBack} aria-label="Back to cuisines">
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="text-center">
          <img src={laicaLogo} alt="Laica" className="planning-logo mx-auto" />
          <h1 className="planning-display mt-4 text-3xl font-extrabold leading-tight">
            Three ideas from your pantry
          </h1>
          <Utensils className="mx-auto mt-3 h-5 w-5 text-primary" aria-hidden="true" />
        </div>

        <div className="mt-7 space-y-3">
          {featuredRecipe && renderTicket(featuredRecipe, visibleRecommendations.findIndex((recipe) => recipe.id === featuredRecipe.id), true)}
          {sideRecipes.map((recipe) => renderTicket(recipe, visibleRecommendations.findIndex((item) => item.id === recipe.id)))}
        </div>

        <div className="mt-6 space-y-3">
          <Button
            className="h-12 w-full rounded-xl font-extrabold"
            disabled={!selectedMeal}
            onClick={() => setCurrentStep('prep-tray')}
          >
            <ChefHat className="h-5 w-5" />
            View prep tray
          </Button>
          <Button
            variant="outline"
            className="h-12 w-full rounded-xl font-extrabold"
            disabled={isLoading}
            onClick={generateRecommendations}
          >
            {isLoading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                Making...
              </>
            ) : (
              <>
                <RefreshCw className="h-5 w-5" />
                New three
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
          <button type="button" className="planning-back-button mb-6" onClick={handleBack} aria-label="Back to three ideas">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="planning-note">
            <ChefHat className="h-5 w-5" />
            <span>Choose one ticket before opening the prep tray.</span>
          </div>
        </section>
      );
    }

    return (
      <section className="planning-screen mx-auto min-h-[calc(100vh-6rem)] w-full max-w-md px-4 pb-4 pt-8">
        <button type="button" className="planning-back-button mb-6" onClick={handleBack} aria-label="Back to three ideas">
          <ArrowLeft className="h-5 w-5" />
        </button>

        {/* design:tone-override — Prep Tray is the Phase 3 tactile ticket-detail object, not a generic recipe card. */}
        <div className="planning-prep-tray">
          <div className="planning-prep-hero" aria-hidden="true">🥣</div>
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
  if (currentStep === 'tickets') return renderTicketsStep();
  return renderPrepTray();
}
