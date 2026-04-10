import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Clock, Plus, X, ArrowLeft, ChefHat } from 'lucide-react';
import { fetchSlopBowlRecipe, type SlopBowlRecipe } from '@/lib/openai';
import { withDemoErrorHandling } from '@/lib/rateLimitHandler';
import { useUpdateUserProfile } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

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
  onUpdateProfile: (profile: UserProfile) => void;
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
];

export default function SlopBowl({ userProfile, onMealSelected, onBackToPlanning, onUpdateProfile }: SlopBowlProps) {
  const { toast } = useToast();
  const updateProfileMutation = useUpdateUserProfile();

  const [state, setState] = useState<SlopBowlState>('pantry-check');
  const [ingredients, setIngredients] = useState<string[]>(userProfile.pantryIngredients);
  const [newIngredient, setNewIngredient] = useState('');
  const [recipe, setRecipe] = useState<SlopBowlRecipe | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [previousRecipe, setPreviousRecipe] = useState<string | undefined>();
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  // Rotate loading messages
  useEffect(() => {
    if (state !== 'generating') return;
    const interval = setInterval(() => {
      setLoadingMessageIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [state]);

  const removeIngredient = (index: number) => {
    setIngredients(prev => prev.filter((_, i) => i !== index));
  };

  const addIngredient = () => {
    const trimmed = newIngredient.trim().toLowerCase();
    if (trimmed && !ingredients.includes(trimmed)) {
      setIngredients(prev => [...prev, trimmed]);
      setNewIngredient('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addIngredient();
    }
  };

  const confirmPantry = async () => {
    // Save updated pantry to profile
    const updatedProfile = { ...userProfile, pantryIngredients: ingredients };
    updateProfileMutation.mutate(updatedProfile);
    onUpdateProfile(updatedProfile);

    // Start generation
    generateBowl(ingredients);
  };

  const generateBowl = useCallback(async (pantryOverride?: string[], feedback?: string, prevRecipe?: string) => {
    setState('generating');
    setIsLoading(true);
    setLoadingMessageIndex(0);

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
    generateBowl(ingredients, feedback, previousRecipe);
  };

  // ── Pantry Check ──────────────────────────────────────────────────────────
  const renderPantryCheck = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Quick pantry check</h2>
        <p className="text-gray-600">
          Here's what we think you have. Tap to remove anything that's gone. Add anything we missed.
        </p>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {ingredients.map((item, index) => (
              <Badge
                key={`${item}-${index}`}
                variant="secondary"
                className="bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-700 cursor-pointer transition-colors px-3 py-1.5 text-sm"
                onClick={() => removeIngredient(index)}
              >
                {item}
                <X className="h-3 w-3 ml-1.5" />
              </Badge>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              value={newIngredient}
              onChange={(e) => setNewIngredient(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add an ingredient..."
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={addIngredient}
              disabled={!newIngredient.trim()}
              className="px-3"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-xs text-gray-400 text-center">
            {ingredients.length} ingredient{ingredients.length !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      <Button
        onClick={confirmPantry}
        disabled={ingredients.length === 0}
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

        <div className="text-center space-y-2">
          <p className="text-sm text-gray-400">Not feeling it? No judgment.</p>
          <Button
            variant="outline"
            onClick={handleReject}
            className="border-[#FF6B6B] text-[#FF6B6B] hover:bg-[#FF6B6B] hover:text-white"
          >
            Try something else
          </Button>
          <div>
            <button
              onClick={onBackToPlanning}
              className="text-sm text-gray-400 underline hover:text-gray-600 mt-2"
            >
              Plan your own meal instead
            </button>
          </div>
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
            className="w-full bg-[#FF6B6B] hover:bg-[#FF5252] text-white"
          >
            Generate another bowl
          </Button>

          <button
            onClick={() => handleRegenerate(false)}
            className="w-full text-sm text-gray-400 underline hover:text-gray-600 text-center"
          >
            Skip and just surprise me
          </button>
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

