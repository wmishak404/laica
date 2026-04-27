import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Clock, ArrowLeft, ChefHat, Settings, X } from 'lucide-react';
import {
  fetchSlopBowlRecipe,
  SLOP_BOWL_TOO_FEW_INGREDIENTS,
  SlopBowlApiError,
  type SlopBowlRecipe,
} from '@/lib/openai';
import { handleAPIError } from '@/lib/rateLimitHandler';

interface UserProfile {
  cookingSkill: string;
  dietaryRestrictions: string[];
  weeklyTime: string;
  pantryIngredients: string[];
  kitchenEquipment: string[];
  favoriteChefs: string[];
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
  // phase-3 enrichment fields — passed through to /api/cooking/steps
  ingredients?: string[];
  equipment?: string[];
  overview?: string;
}

interface SlopBowlProps {
  userProfile: UserProfile;
  onMealSelected: (meal: RecipeRecommendation, scheduledTime: string) => void;
  onBackToPlanning: () => void;
  onEditPantry: () => void;
}

type SlopBowlState = 'pantry-check' | 'generating' | 'approval' | 'feedback';

interface PantryItem {
  id: string;
  name: string;
  source: 'profile' | 'manual';
}

const LOADING_MESSAGES = [
  "Rummaging through your pantry...",
  "Assembling chaos into deliciousness...",
  "This is going to be questionable in the best way...",
  "Trust the process...",
  "Picking the perfect base layer...",
  "Deciding if this needs more hot sauce...",
  "Making your pantry work overtime...",
  "Chef's intuition loading...",
  "Negotiating with the leftovers...",
  "Pretending we know what we're doing...",
  "Convincing your sad tomato it has potential...",
  "Channeling your inner depression-meal genius...",
  "Auditioning rice for the lead role...",
  "Whispering encouragement to your spice rack...",
  "Embracing culinary improv...",
  "Calculating maximum slop-to-bowl ratio...",
  "Reminding the pasta who's boss...",
  "Strategically hiding the wilted herbs...",
  "Bargaining with the food gods...",
  "Doing math nobody asked for...",
];

const pickRandomMessageIndex = (current: number) => {
  if (LOADING_MESSAGES.length <= 1) return 0;
  let next = current;
  while (next === current) {
    next = Math.floor(Math.random() * LOADING_MESSAGES.length);
  }
  return next;
};

const normalizeIngredient = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase();
const MIN_SLOP_BOWL_INGREDIENTS = 3;

const countDistinctIngredients = (ingredients: string[]) =>
  new Set(ingredients.map(normalizeIngredient).filter(Boolean)).size;

const createProfilePantryItems = (ingredients: string[]): PantryItem[] =>
  ingredients.map((name, index) => ({
    id: `profile-${index}-${normalizeIngredient(name)}`,
    name,
    source: 'profile',
  }));

export default function SlopBowl({ userProfile, onMealSelected, onBackToPlanning, onEditPantry }: SlopBowlProps) {
  const [state, setState] = useState<SlopBowlState>('pantry-check');
  const [recipe, setRecipe] = useState<SlopBowlRecipe | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [previousRecipe, setPreviousRecipe] = useState<string | undefined>();
  const [pantryItems, setPantryItems] = useState<PantryItem[]>(() => createProfilePantryItems(userProfile.pantryIngredients));
  const [ingredientInput, setIngredientInput] = useState('');
  const [pantryMessage, setPantryMessage] = useState<string | null>(null);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(() =>
    Math.floor(Math.random() * LOADING_MESSAGES.length)
  );

  // Rotate loading messages randomly (never repeating consecutively)
  useEffect(() => {
    if (state !== 'generating') return;
    const interval = setInterval(() => {
      setLoadingMessageIndex(prev => pickRandomMessageIndex(prev));
    }, 2000);
    return () => clearInterval(interval);
  }, [state]);

  useEffect(() => {
    setPantryItems(createProfilePantryItems(userProfile.pantryIngredients));
    setIngredientInput('');
    setPantryMessage(null);
  }, [userProfile.pantryIngredients]);

  const pantryNames = pantryItems.map((item) => item.name);
  const distinctPantryCount = countDistinctIngredients(pantryNames);
  const normalizedIngredientInput = normalizeIngredient(ingredientInput);
  const canAddIngredient = normalizedIngredientInput.length > 0 &&
    !pantryItems.some((item) => normalizeIngredient(item.name) === normalizedIngredientInput);
  const missingIngredientCount = Math.max(MIN_SLOP_BOWL_INGREDIENTS - distinctPantryCount, 0);
  const hasSparsePantry = distinctPantryCount > 0 && distinctPantryCount < MIN_SLOP_BOWL_INGREDIENTS;
  const canGenerateBowl = distinctPantryCount >= MIN_SLOP_BOWL_INGREDIENTS;

  const confirmPantry = () => {
    if (!canGenerateBowl) {
      setPantryMessage(
        hasSparsePantry
          ? `Add ${missingIngredientCount} more ingredient${missingIngredientCount === 1 ? '' : 's'} so Laica has enough to build a real bowl. Think base, vegetable, sauce, seasoning, egg, cheese, beans, or leftovers.`
          : 'Add a few ingredients so Laica has enough to build a real bowl.'
      );
      return;
    }

    setPantryMessage(null);
    generateBowl(pantryNames);
  };

  const generateBowl = useCallback(async (pantryOverride?: string[], feedback?: string, prevRecipe?: string) => {
    setState('generating');
    setIsLoading(true);
    setLoadingMessageIndex(prev => pickRandomMessageIndex(prev));

    try {
      const result = await fetchSlopBowlRecipe({
        pantryOverride,
        feedback: feedback || undefined,
        previousRecipe: prevRecipe || undefined,
      });

      setRecipe(result.recipe);
      setPantryMessage(null);
      setState('approval');
    } catch (error) {
      if (error instanceof SlopBowlApiError && error.code === SLOP_BOWL_TOO_FEW_INGREDIENTS) {
        setPantryMessage(
          error.message || 'Add at least 3 ingredients so Laica has enough to build a real bowl.'
        );
      } else {
        handleAPIError(error as Error, 'slop-bowl');
      }
      setState('pantry-check');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleAccept = () => {
    if (!recipe) return;

    const meal: RecipeRecommendation = {
      id: `slop-bowl-${Date.now()}`,
      recipeName: recipe.recipeName,
      description: recipe.description,
      cookTime: recipe.cookTime,
      difficulty: recipe.difficulty,
      cuisine: recipe.cuisine,
      pantryMatch: recipe.pantryMatch,
      missingIngredients: recipe.additionalIngredientsNeeded,
      isFusion: recipe.isFusion,
      // phase-3 enrichment — passed through to /api/cooking/steps for context-aware step generation
      ingredients: recipe.pantryIngredientsUsed,
      equipment: userProfile.kitchenEquipment,
      overview: recipe.overview,
    };
    onMealSelected(meal, 'now');
  };

  const handleReject = () => {
    if (recipe) {
      setPreviousRecipe(recipe.recipeName);
    }
    setFeedbackText('');
    setState('feedback');
  };

  const handleRegenerate = (withFeedback: boolean) => {
    const feedback = withFeedback ? feedbackText.trim() : undefined;
    generateBowl(pantryNames, feedback, previousRecipe);
  };

  const handleRemoveIngredient = (id: string) => {
    setPantryMessage(null);
    setPantryItems((items) => items.filter((item) => item.id !== id));
  };

  const handleAddIngredient = () => {
    const nextIngredient = ingredientInput.trim().replace(/\s+/g, ' ');
    if (!canAddIngredient) return;

    setPantryMessage(null);
    setPantryItems((items) => [
      ...items,
      {
        id: `manual-${Date.now()}-${normalizedIngredientInput}`,
        name: nextIngredient,
        source: 'manual',
      },
    ]);
    setIngredientInput('');
  };

  // ── Pantry Check ──────────────────────────────────────────────────────────
  const renderPantryCheck = () => {
    const pantry = pantryItems;
    const hasManualAdditions = pantry.some((item) => item.source === 'manual');

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Quick pantry check</h2>
          <p className="text-gray-600">
            Remove anything you&apos;re out of, or add something for this bowl only. Use your profile for permanent pantry changes.
          </p>
        </div>

        <Card>
          <CardContent className="p-4 space-y-4">
            {pantry.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {pantry.map((item) => (
                  <Badge
                    key={item.id}
                    variant={item.source === 'manual' ? 'outline' : 'secondary'}
                    className={
                      item.source === 'manual'
                        ? 'gap-1 border-primary/20 bg-primary/10 px-3 py-1.5 text-sm text-primary'
                        : 'gap-1 bg-gray-100 px-3 py-1.5 text-sm text-gray-700'
                    }
                  >
                    {item.source === 'manual' && (
                      <span className="text-[10px] font-bold uppercase tracking-wide text-primary/80">
                        Added
                      </span>
                    )}
                    <span>{item.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredient(item.id)}
                      aria-label={`Remove ${item.name}`}
                      className={
                        item.source === 'manual'
                          ? 'rounded-full p-0.5 text-primary/70 transition hover:bg-primary/15 hover:text-primary'
                          : 'rounded-full p-0.5 text-gray-500 transition hover:bg-black/5 hover:text-gray-700'
                      }
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-2">
                No pantry items on file yet. Add an ingredient below or open your profile to update the full pantry.
              </p>
            )}

            <form
              className="space-y-2"
              onSubmit={(event) => {
                event.preventDefault();
                handleAddIngredient();
              }}
            >
              <div className="flex gap-2">
                <Input
                  value={ingredientInput}
                  onChange={(event) => setIngredientInput(event.target.value)}
                  placeholder="Add an ingredient"
                  className="flex-1"
                />
                <Button type="submit" variant="outline" disabled={!canAddIngredient}>
                  Add
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Changes here only apply to this bowl. Use profile settings if you want them to stick.
              </p>
              {!canAddIngredient && normalizedIngredientInput.length > 0 && (
                <p className="text-xs text-amber-600">That ingredient is already in this bowl.</p>
              )}
            </form>

            <p className="text-xs text-gray-400 text-center">
              {pantry.length} ingredient{pantry.length !== 1 ? 's' : ''} ready for this bowl
            </p>

            {hasSparsePantry && (
              <p className="text-xs text-center text-amber-700">
                Add {missingIngredientCount} more ingredient{missingIngredientCount === 1 ? '' : 's'} before we make this a bowl. Try a base, vegetable, sauce, seasoning, egg, cheese, beans, or leftovers.
              </p>
            )}

            {pantryMessage && (
              <p className="text-xs text-center text-amber-700">
                {pantryMessage}
              </p>
            )}

            {hasManualAdditions && (
              <p className="text-xs text-center text-primary">
                Ingredients tagged Added are temporary and won&apos;t change your saved pantry.
              </p>
            )}

            <Button
              variant="outline"
              onClick={onEditPantry}
              className="w-full"
            >
              <Settings className="h-4 w-4 mr-2" />
              Edit pantry in profile
            </Button>
          </CardContent>
        </Card>

        <Button
          onClick={confirmPantry}
          disabled={!canGenerateBowl}
          className="w-full bg-[#FF6B6B] hover:bg-[#FF5252] text-white py-3 text-lg"
        >
          This looks right
        </Button>

        <Button
          variant="ghost"
          onClick={onBackToPlanning}
          className="w-full text-gray-500"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to options
        </Button>
      </div>
    );
  };

  // ── Generating ────────────────────────────────────────────────────────────
  const renderGenerating = () => (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-[#FF6B6B]" />
      <p className="text-lg text-gray-700 font-medium animate-pulse">
        {LOADING_MESSAGES[loadingMessageIndex]}
      </p>
    </div>
  );

  // ── Approval ──────────────────────────────────────────────────────────────
  const renderApproval = () => {
    if (!recipe) return null;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">We made you a thing.</h2>
          <p className="text-gray-500 text-sm">Look what your pantry had hiding in it</p>
        </div>

        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {/* Recipe header */}
            <div className="p-4 pb-3">
              <div className="flex items-start justify-between mb-1">
                <h3 className="font-bold text-xl text-gray-900 flex-1">{recipe.recipeName}</h3>
                <span className="flex items-center gap-1 text-sm text-gray-500 ml-2 shrink-0">
                  <Clock className="h-4 w-4" />
                  {recipe.cookTime}min
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>{recipe.cuisine}</span>
                <span>·</span>
                <span>{recipe.difficulty}</span>
                {recipe.isFusion && (
                  <Badge className="bg-[#FFB347] text-white text-xs px-2 py-0.5">Fusion</Badge>
                )}
              </div>
            </div>

            {/* What's going in the bowl */}
            {recipe.pantryIngredientsUsed.length > 0 && (
              <div className="border-t border-gray-100 px-4 py-3">
                <p className="text-xs font-medium text-gray-500 mb-2">What's going in:</p>
                <div className="flex flex-wrap gap-1.5">
                  {recipe.pantryIngredientsUsed.map((item) => (
                    <Badge key={item} variant="secondary" className="text-xs bg-green-50 text-green-700 border-green-200">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Missing ingredients */}
            {recipe.additionalIngredientsNeeded.length > 0 && (
              <div className="border-t border-gray-100 px-4 py-3 bg-amber-50">
                <p className="text-sm font-medium text-amber-800 mb-1.5">You'll need to grab:</p>
                <div className="flex flex-wrap gap-1.5">
                  {recipe.additionalIngredientsNeeded.map((item) => (
                    <Badge key={item} variant="outline" className="text-xs border-amber-300 text-amber-700">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Button
          onClick={handleAccept}
          className="w-full bg-[#FF6B6B] hover:bg-[#FF5252] text-white py-3 text-lg"
        >
          <ChefHat className="h-5 w-5 mr-2" />
          Let's cook this!
        </Button>

        <div className="space-y-3">
          <p className="text-sm text-gray-400 text-center">Not feeling it? No judgment.</p>
          <Button
            variant="outline"
            onClick={handleReject}
            className="w-full border-[#FF6B6B] text-[#FF6B6B] hover:bg-[#FF6B6B] hover:text-white py-3 text-lg"
          >
            Try something else
          </Button>
          <Button
            onClick={onBackToPlanning}
            className="w-full bg-[#FF6B6B] hover:bg-[#FF5252] text-white py-3 text-lg"
          >
            Plan your own meal instead
          </Button>
        </div>
      </div>
    );
  };

  // ── Feedback ──────────────────────────────────────────────────────────────
  const renderFeedback = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">What would you change?</h2>
        <p className="text-gray-600 text-sm">
          Optional — tell Laica what you'd prefer
        </p>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <Textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder='e.g. "less spicy" or "something Asian instead"'
            rows={3}
            className="resize-none"
          />

          <Button
            onClick={() => handleRegenerate(true)}
            disabled={isLoading}
            className="w-full bg-[#FF6B6B] hover:bg-[#FF5252] text-white py-3 text-lg"
          >
            Recommend another bowl
          </Button>

          <Button
            onClick={() => handleRegenerate(false)}
            disabled={isLoading}
            className="w-full bg-[#FF6B6B] hover:bg-[#FF5252] text-white py-3 text-lg"
          >
            Skip and just surprise me
          </Button>
        </CardContent>
      </Card>

      <Button
        variant="ghost"
        onClick={() => setState('approval')}
        className="w-full text-gray-500"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Go back to previous bowl
      </Button>
    </div>
  );

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-md mx-auto p-4">
      {state === 'pantry-check' && renderPantryCheck()}
      {state === 'generating' && renderGenerating()}
      {state === 'approval' && renderApproval()}
      {state === 'feedback' && renderFeedback()}
    </div>
  );
}
