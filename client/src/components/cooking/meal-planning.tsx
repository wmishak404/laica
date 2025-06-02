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
  name: string;
  description: string;
  cookTime: number;
  difficulty: string;
  cuisine: string;
  pantryMatch: number;
  missingIngredients: string[];
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
  const [scheduledTime, setScheduledTime] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [newMeal, setNewMeal] = useState('');

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

  const schedulingOptions = [
    { value: 'now', label: 'Start cooking now' },
    { value: '1hour', label: 'In 1 hour' },
    { value: '2hours', label: 'In 2 hours' },
    { value: 'tonight', label: 'Tonight (6-8 PM)' },
    { value: 'tomorrow', label: 'Tomorrow' },
    { value: 'custom', label: 'Pick specific time' }
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
    setIsLoading(true);
    
    // This would connect to your LLM API with the user's preferences
    // For now, showing the structure with realistic examples
    setTimeout(() => {
      const mockRecommendations: RecipeRecommendation[] = [
        {
          id: '1',
          name: 'Garlic Butter Pasta with Herbs',
          description: 'Simple pasta using your pantry staples with fresh herbs for flavor',
          cookTime: 25,
          difficulty: 'Easy',
          cuisine: 'Italian',
          pantryMatch: 85,
          missingIngredients: ['fresh herbs', 'parmesan cheese']
        },
        {
          id: '2',
          name: 'Quick Vegetable Stir Fry',
          description: 'Healthy stir fry using available vegetables and pantry sauces',
          cookTime: 20,
          difficulty: 'Easy',
          cuisine: 'Asian',
          pantryMatch: 90,
          missingIngredients: ['soy sauce']
        },
        {
          id: '3',
          name: 'One-Pan Chicken and Rice',
          description: 'Complete meal cooked in one pan for easy cleanup',
          cookTime: 45,
          difficulty: 'Medium',
          cuisine: 'Mediterranean',
          pantryMatch: 75,
          missingIngredients: ['chicken thighs', 'lemon']
        }
      ];
      
      setRecommendations(mockRecommendations);
      setIsLoading(false);
      setCurrentStep(4);
    }, 1500);
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

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={onBackToProfile}>
                  Back
                </Button>
                <Button 
                  onClick={() => setCurrentStep(2)}
                  disabled={!canProceedFromStep1}
                  className="bg-[#FF6B6B] hover:bg-[#FF5252] text-white"
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
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      mealPrefs.cuisinePreference.includes(cuisine)
                        ? 'border-[#FF6B6B] bg-[#FF6B6B]/10 text-[#FF6B6B]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleCuisine(cuisine)}
                  >
                    <span className="text-sm font-medium">{cuisine}</span>
                  </div>
                ))}
              </div>

              {mealPrefs.cuisinePreference.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Selected cuisines:</Label>
                  <div className="flex flex-wrap gap-2">
                    {mealPrefs.cuisinePreference.map((cuisine) => (
                      <Badge 
                        key={cuisine} 
                        variant="secondary"
                        className="bg-[#4ECDC4] text-white hover:bg-[#4ECDC4]/80"
                      >
                        {cuisine}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  Back
                </Button>
                <Button 
                  onClick={() => setCurrentStep(3)}
                  disabled={!canProceedFromStep2}
                  className="bg-[#FF6B6B] hover:bg-[#FF5252] text-white"
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
                <Label>What have you eaten recently? (Optional)</Label>
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

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  Back
                </Button>
                <Button 
                  onClick={generateRecommendations}
                  className="bg-[#FF6B6B] hover:bg-[#FF5252] text-white"
                >
                  Get Meal Recommendations
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
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-lg">{recipe.name}</h3>
                          <Badge className="bg-[#4ECDC4] text-white">
                            {recipe.pantryMatch}% match
                          </Badge>
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{recipe.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {recipe.cookTime} min
                          </span>
                          <span>{recipe.difficulty}</span>
                          <span>{recipe.cuisine}</span>
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

              {selectedMeal && (
                <Card className="bg-gray-50">
                  <CardHeader>
                    <CardTitle className="text-lg">When would you like to cook?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup 
                      value={scheduledTime} 
                      onValueChange={setScheduledTime}
                      className="space-y-2"
                    >
                      {schedulingOptions.map((option) => (
                        <div key={option.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={option.value} id={option.value} />
                          <Label htmlFor={option.value} className="cursor-pointer">
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(3)}>
                  Back
                </Button>
                {selectedMeal && scheduledTime && (
                  <Button 
                    onClick={() => onMealSelected(selectedMeal, scheduledTime)}
                    className="bg-[#FFE66D] hover:bg-[#FFD93D] text-gray-700"
                  >
                    Start Cooking {selectedMeal.name}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-gray-900">Plan Your Meal</h1>
          <div className="text-sm text-gray-500">
            Step {currentStep} of 4
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