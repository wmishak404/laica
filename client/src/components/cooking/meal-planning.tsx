import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Clock, ChefHat, Users, Calendar, Plus } from 'lucide-react';
import { fetchPantryRecipes } from '@/lib/openai';
import { withDemoErrorHandling } from '@/lib/rateLimitHandler';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  cookingSkill: string;
  dietaryRestrictions: string[];
  weeklyTime: string;
  pantryIngredients: string[];
  kitchenEquipment: string[];
  favoriteChefs: string[];
}

interface MealPreferences {
  previousMeals: string[];
  timeAvailable: string;
  cuisinePreference: string[];
  avoidToday: string;
  missingIngredients: string[];
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
}

interface MealPlanningProps {
  userProfile: UserProfile;
  onMealSelected: (meal: RecipeRecommendation, scheduledTime: string) => void;
  onBackToProfile: () => void;
}

export default function MealPlanning({ userProfile, onMealSelected, onBackToProfile }: MealPlanningProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [mealPrefs, setMealPrefs] = useState<MealPreferences>({
    previousMeals: [],
    timeAvailable: '',
    cuisinePreference: [],
    avoidToday: '',
    missingIngredients: []
  });
  const [recommendations, setRecommendations] = useState<RecipeRecommendation[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<RecipeRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [newMeal, setNewMeal] = useState('');
  const { toast } = useToast();

  const timeOptions = [
    { value: '30', label: '30 minutes' },
    { value: '60', label: '1 hour' },
    { value: '90', label: '1.5 hours' },
    { value: '120', label: '2+ hours' }
  ];

  const cuisineOptions = [
    'Italian', 'Asian', 'Mexican', 'Indian', 'Mediterranean', 
    'American', 'French', 'Thai', 'Japanese', 'Middle Eastern',
    'Korean', 'Vietnamese', 'Greek', 'Spanish', 'No preference'
  ];


  const addMeal = () => {
    if (newMeal.trim()) {
      setMealPrefs(prev => ({
        ...prev,
        previousMeals: [...prev.previousMeals, newMeal.trim()]
      }));
      setNewMeal('');
    }
  };

  const removeMeal = (index: number) => {
    setMealPrefs(prev => ({
      ...prev,
      previousMeals: prev.previousMeals.filter((_, i) => i !== index)
    }));
  };

  const toggleCuisine = (cuisine: string) => {
    setMealPrefs(prev => ({
      ...prev,
      cuisinePreference: prev.cuisinePreference.includes(cuisine)
        ? prev.cuisinePreference.filter(c => c !== cuisine)
        : [...prev.cuisinePreference, cuisine]
    }));
  };

  const generateRecommendations = async () => {
    // Check if user profile is complete before generating recommendations
    if (!userProfile.pantryIngredients || userProfile.pantryIngredients.length === 0) {
      toast({
        title: "Profile Incomplete",
        description: "Please add pantry ingredients to your profile before getting meal recommendations.",
        variant: "destructive"
      });
      return;
    }

    if (!userProfile.cookingSkill || !userProfile.weeklyTime) {
      toast({
        title: "Profile Incomplete", 
        description: "Please complete your cooking profile before getting meal recommendations.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    const result = await withDemoErrorHandling(async () => {
      // Build preferences string from user inputs
      const preferenceParts = [];
      
      if (mealPrefs.timeAvailable) {
        preferenceParts.push(`Time available: ${mealPrefs.timeAvailable}`);
      }
      
      if (mealPrefs.cuisinePreference.length > 0) {
        preferenceParts.push(`Preferred cuisines: ${mealPrefs.cuisinePreference.join(', ')}`);
      }
      
      if (userProfile.dietaryRestrictions.length > 0) {
        preferenceParts.push(`Dietary restrictions: ${userProfile.dietaryRestrictions.join(', ')}`);
      }
      
      if (userProfile.cookingSkill) {
        preferenceParts.push(`Cooking skill: ${userProfile.cookingSkill}`);
      }
      
      if (mealPrefs.avoidToday) {
        preferenceParts.push(`Avoid today: ${mealPrefs.avoidToday}`);
      }
      
      if (mealPrefs.previousMeals.length > 0) {
        preferenceParts.push(`Recently had: ${mealPrefs.previousMeals.join(', ')}`);
      }
      
      const preferences = preferenceParts.join('. ');
      
      // Call recipe API with user's actual pantry ingredients and preferences
      const recipeResponse = await fetchPantryRecipes(
        userProfile.pantryIngredients,
        preferences,
        mealPrefs.timeAvailable
      );
      
      // Transform response to match our interface
      const newRecommendations: RecipeRecommendation[] = [];
      
      if (recipeResponse.recipes) {
        recipeResponse.recipes.forEach((recipe: any, index: number) => {
          newRecommendations.push({
            id: `recipe-${index}`,
            recipeName: recipe.recipeName || 'Unnamed Recipe',
            description: recipe.description || 'Delicious meal using your pantry ingredients',
            cookTime: recipe.cookTime || 30,
            difficulty: recipe.difficulty || 'Medium',
            cuisine: recipe.cuisine || 'International',
            pantryMatch: Math.round(((userProfile.pantryIngredients.length - (recipe.additionalIngredientsNeeded?.length || 0)) / userProfile.pantryIngredients.length) * 100),
            missingIngredients: recipe.additionalIngredientsNeeded || [],
            isFusion: recipe.isFusion || false
          });
        });
      }
      
      if (newRecommendations.length === 0) {
        throw new Error('No recipes generated');
      }
      
      // Clear any previously selected meal when new recommendations are generated
      setSelectedMeal(null);
      
      return newRecommendations;
    }, 'meal recommendations');

    if (result) {
      setRecommendations(result);
      setCurrentStep(4);
    }
    
    setIsLoading(false);
  };

  const generateMoreRecommendations = async () => {
    // Check if user profile is complete before generating more recommendations
    if (!userProfile.pantryIngredients || userProfile.pantryIngredients.length === 0) {
      toast({
        title: "Profile Incomplete",
        description: "Please add pantry ingredients to your profile before getting meal recommendations.",
        variant: "destructive"
      });
      return;
    }

    setIsLoadingMore(true);
    
    try {
      // Build preferences string from user inputs
      const preferenceParts = [];
      
      if (mealPrefs.timeAvailable) {
        preferenceParts.push(`Time available: ${mealPrefs.timeAvailable}`);
      }
      
      if (mealPrefs.cuisinePreference.length > 0) {
        preferenceParts.push(`Preferred cuisines: ${mealPrefs.cuisinePreference.join(', ')}`);
      }
      
      if (userProfile.dietaryRestrictions.length > 0) {
        preferenceParts.push(`Dietary restrictions: ${userProfile.dietaryRestrictions.join(', ')}`);
      }
      
      if (userProfile.cookingSkill) {
        preferenceParts.push(`Cooking skill: ${userProfile.cookingSkill}`);
      }
      
      if (mealPrefs.avoidToday) {
        preferenceParts.push(`Avoid today: ${mealPrefs.avoidToday}`);
      }
      
      if (mealPrefs.previousMeals.length > 0) {
        preferenceParts.push(`Recently had: ${mealPrefs.previousMeals.join(', ')}`);
      }
      
      // Add existing recommendations to avoid duplicates
      if (recommendations.length > 0) {
        preferenceParts.push(`Please suggest different recipes, not: ${recommendations.map(r => r.recipeName).join(', ')}`);
      }
      
      const preferences = preferenceParts.join('. ');
      
      // Call recipe API with user's actual pantry ingredients and preferences
      const recipeResponse = await fetchPantryRecipes(
        userProfile.pantryIngredients,
        preferences,
        mealPrefs.timeAvailable
      );
      
      // Transform response to match our interface
      const newRecommendations: RecipeRecommendation[] = [];
      
      if (recipeResponse.recipes) {
        recipeResponse.recipes.forEach((recipe: any, index: number) => {
          newRecommendations.push({
            id: `recipe-more-${Date.now()}-${index}`,
            recipeName: recipe.recipeName || 'Unnamed Recipe',
            description: recipe.description || 'Delicious meal using your pantry ingredients',
            cookTime: recipe.cookTime || 30,
            difficulty: recipe.difficulty || 'Medium',
            cuisine: recipe.cuisine || 'International',
            pantryMatch: Math.round(((userProfile.pantryIngredients.length - (recipe.additionalIngredientsNeeded?.length || 0)) / userProfile.pantryIngredients.length) * 100),
            missingIngredients: recipe.additionalIngredientsNeeded || []
          });
        });
      }
      
      if (newRecommendations.length === 0) {
        throw new Error('No new recipes generated');
      }
      
      // Add new recommendations to existing ones
      setRecommendations(prev => [...prev, ...newRecommendations]);
    } catch (error) {
      console.error('Error generating more recommendations:', error);
      toast({
        title: "Failed to Load More",
        description: "Unable to generate additional recipes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingMore(false);
    }
  };

  const canProceedFromStep1 = mealPrefs.timeAvailable !== '';
  const canProceedFromStep2 = mealPrefs.cuisinePreference.length > 0;
  const canProceedFromStep3 = true; // Optional step

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle>How much time do you have today?</CardTitle>
              <p className="text-sm text-gray-600">Including cleanup time</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <RadioGroup 
                value={mealPrefs.timeAvailable} 
                onValueChange={(value) => setMealPrefs(prev => ({ ...prev, timeAvailable: value }))}
                className="space-y-3"
              >
                {timeOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-4 pt-4">
                <Button variant="outline" onClick={onBackToProfile} className="w-full sm:w-auto">
                  Back
                </Button>
                <Button 
                  onClick={() => setCurrentStep(2)}
                  disabled={!canProceedFromStep1}
                  className="w-full sm:w-auto bg-[#FF6B6B] hover:bg-[#FF5252] text-white"
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle>What cuisines sound good to you?</CardTitle>
              <p className="text-sm text-gray-600">You can select multiple cuisines</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {cuisineOptions.map((cuisine) => (
                  <div 
                    key={cuisine} 
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all active:scale-95 min-h-[48px] flex items-center justify-center ${
                      mealPrefs.cuisinePreference.includes(cuisine)
                        ? 'border-[#FF6B6B] bg-[#FF6B6B]/10 text-[#FF6B6B]'
                        : 'border-gray-200 hover:border-gray-300 active:bg-gray-50'
                    }`}
                    onClick={() => toggleCuisine(cuisine)}
                  >
                    <span className="text-sm font-medium text-center">{cuisine}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-4 pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(1)} className="w-full sm:w-auto">
                  Back
                </Button>
                <Button 
                  onClick={() => setCurrentStep(3)}
                  disabled={!canProceedFromStep2}
                  className="w-full sm:w-auto bg-[#FF6B6B] hover:bg-[#FF5252] text-white"
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Anything to avoid or specify?</CardTitle>
              <p className="text-sm text-gray-600">Optional preferences</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="avoid-today">Anything you want to avoid today?</Label>
                <Textarea
                  id="avoid-today"
                  placeholder="e.g., too spicy, heavy meals, dairy..."
                  value={mealPrefs.avoidToday}
                  onChange={(e) => setMealPrefs(prev => ({ ...prev, avoidToday: e.target.value }))}
                  rows={3}
                />
              </div>

              <div>
                <Label>What have you eaten recently?</Label>
                <p className="text-xs text-gray-500 mb-3">You may enter one dish at a time and click "Add" to build your list</p>
                <div className="flex gap-2 mb-3">
                  <Input
                    placeholder="e.g., pasta, salad, burgers..."
                    value={newMeal}
                    onChange={(e) => setNewMeal(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addMeal()}
                    className="flex-1"
                  />
                  <Button 
                    onClick={addMeal} 
                    disabled={!newMeal.trim()}
                    size="sm"
                    className="bg-[#FFE66D] hover:bg-[#FFD93D] text-gray-700"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>
                
                {mealPrefs.previousMeals.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Recent meals:</Label>
                    <div className="flex flex-wrap gap-2">
                      {mealPrefs.previousMeals.map((meal, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary"
                          className="bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer"
                          onClick={() => removeMeal(index)}
                        >
                          {meal} ×
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">Click on a meal to remove it</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-4 pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(2)} className="w-full sm:w-auto">
                  Back
                </Button>
                <Button 
                  onClick={generateRecommendations}
                  disabled={isLoading}
                  className="w-full sm:w-auto bg-[#FF6B6B] hover:bg-[#FF5252] text-white disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating recommendations...
                    </>
                  ) : (
                    'Get Meal Recommendations'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="h-5 w-5" />
                Perfect meals for you!
              </CardTitle>
              <div className="bg-[#FFE66D] text-gray-700 p-3 rounded-lg">
                <p className="text-sm font-medium">
                  Based on your {userProfile.pantryIngredients.length} pantry ingredients and preferences
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B6B] mx-auto"></div>
                  <p className="mt-2 text-gray-600">Finding perfect recipes for you...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recommendations.map((recipe) => (
                    <Card 
                      key={recipe.id} 
                      className={`cursor-pointer transition-all ${selectedMeal?.id === recipe.id ? 'ring-2 ring-[#FF6B6B]' : 'hover:shadow-md'}`}
                      onClick={() => setSelectedMeal(recipe)}
                    >
                      <CardContent className="p-4">
                        <div className="mb-2">
                          <h3 className="font-semibold text-lg">{recipe.recipeName}</h3>
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{recipe.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {recipe.cookTime} min
                          </span>
                          <span>{recipe.difficulty}</span>
                          {recipe.cuisine && recipe.cuisine !== 'International' && (
                            <span>{recipe.cuisine}</span>
                          )}
                          {recipe.isFusion && (
                            <Badge className="bg-[#FFB347] text-white text-xs px-2 py-1">
                              Fusion
                            </Badge>
                          )}
                        </div>
                        {recipe.missingIngredients.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500">Need to get:</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {recipe.missingIngredients.map((ingredient) => (
                                <Badge key={ingredient} variant="outline" className="text-xs">
                                  {ingredient}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {recommendations.length > 0 && !isLoading && (
                <div className="flex flex-col items-center mt-4 space-y-2">
                  <p className="text-[10px] text-gray-500 text-center">
                    Laica may recommend recipes not according to cuisine preferences to make use of your pantry ingredients.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={generateMoreRecommendations}
                    disabled={isLoadingMore}
                    className="border-[#FF6B6B] text-[#FF6B6B] hover:bg-[#FF6B6B] hover:text-white"
                  >
                    {isLoadingMore ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      'More suggestions'
                    )}
                  </Button>
                </div>
              )}


              <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-4 pt-4">
                <Button variant="outline" onClick={() => {
                  setCurrentStep(3);
                  // Clear selected meal when going back to allow fresh selection
                  setSelectedMeal(null);
                }} className="w-full sm:w-auto">
                  Back
                </Button>
                <Button 
                  onClick={() => {
                    if (!selectedMeal) {
                      toast({
                        title: "Please select a recipe",
                        description: "You must choose one of the recommended recipes to continue cooking.",
                        variant: "destructive"
                      });
                      return;
                    }
                    onMealSelected(selectedMeal, 'now');
                  }}
                  className={`w-full sm:w-auto whitespace-normal sm:whitespace-nowrap text-center min-h-[44px] py-3 leading-tight ${
                    selectedMeal 
                      ? 'bg-[#FFE66D] hover:bg-[#FFD93D] text-gray-700' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  disabled={!selectedMeal}
                >
                  {selectedMeal ? `Start Cooking ${selectedMeal.recipeName}` : 'Select a recipe to continue'}
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 md:p-6 min-h-screen bg-gray-50">
      <div className="mb-4 md:mb-6 bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Plan Your Meal</h1>
          <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {currentStep} of 4
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-[#FF6B6B] h-2 rounded-full transition-all duration-300" 
            style={{ width: `${(currentStep / 4) * 100}%` }}
          ></div>
        </div>
      </div>
      
      {renderCurrentStep()}
    </div>
  );
}