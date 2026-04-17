import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Clock, ArrowLeft, ChefHat, Settings } from 'lucide-react';
import { fetchSlopBowlRecipe, type SlopBowlRecipe } from '@/lib/openai';
import { withDemoErrorHandling } from '@/lib/rateLimitHandler';

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

export default function SlopBowl({ userProfile, onMealSelected, onBackToPlanning, onEditPantry }: SlopBowlProps) {
  const [state, setState] = useState<SlopBowlState>('pantry-check');
  const [recipe, setRecipe] = useState<SlopBowlRecipe | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [previousRecipe, setPreviousRecipe] = useState<string | undefined>();
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

  const confirmPantry = () => {
    generateBowl(userProfile.pantryIngredients);
  };

  const generateBowl = useCallback(async (pantryOverride?: string[], feedback?: string, prevRecipe?: string) => {
    setState('generating');
    setIsLoading(true);
    setLoadingMessageIndex(prev => pickRandomMessageIndex(prev));

    const result = await withDemoErrorHandling(
      () => fetchSlopBowlRecipe({
        pantryOverride,
        feedback: feedback || undefined,
        previousRecipe: prevRecipe || undefined,
      }),
      'slop-bowl'
    );

    setIsLoading(false);

    if (result?.recipe) {
      setRecipe(result.recipe);
      setState('approval');
    } else {
      // Error handled by withDemoErrorHandling, go back to pantry check
      setState('pantry-check');
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
    generateBowl(userProfile.pantryIngredients, feedback, previousRecipe);
  };

  // ── Pantry Check ──────────────────────────────────────────────────────────
  const renderPantryCheck = () => {
    const pantry = userProfile.pantryIngredients;
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Quick pantry check</h2>
          <p className="text-gray-600">
            Here's what we think you have. To make changes, edit your pantry in your profile.
          </p>
        </div>

        <Card>
          <CardContent className="p-4 space-y-4">
            {pantry.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {pantry.map((item, index) => (
                  <Badge
                    key={`${item}-${index}`}
                    variant="secondary"
                    className="bg-gray-100 text-gray-700 px-3 py-1.5 text-sm"
                  >
                    {item}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-2">
                Your pantry is empty. Add some ingredients in your profile to get started.
              </p>
            )}

            <p className="text-xs text-gray-400 text-center">
              {pantry.length} ingredient{pantry.length !== 1 ? 's' : ''}
            </p>

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
          disabled={pantry.length === 0}
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

