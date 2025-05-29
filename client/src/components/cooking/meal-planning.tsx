import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Clock, ChefHat, Users, Calendar } from 'lucide-react';

interface UserProfile {
  cookingSkill: string;
  dietaryRestrictions: string[];
  weeklyTime: string;
  pantryIngredients: string[];
  kitchenEquipment: string[];
  favoriteChefs: string[];
}

interface MealPreferences {
  previousMeals: string;
  timeAvailable: string;
  cuisinePreference: string;
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
    previousMeals: '',
    timeAvailable: '',
    cuisinePreference: '',
    avoidToday: '',
    missingIngredients: []
  });
  const [recommendations, setRecommendations] = useState<RecipeRecommendation[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<RecipeRecommendation | null>(null);
  const [scheduledTime, setScheduledTime] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const timeOptions = [
    { value: '30', label: '30 minutes (including cleanup)' },
    { value: '60', label: '1 hour (including cleanup)' },
    { value: '90', label: '1.5 hours (including cleanup)' },
    { value: '120', label: '2+ hours (including cleanup)' }
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
      setCurrentStep(3);
    }, 1500);
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle>What are you feeling like eating today?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="previous-meals">What have you eaten recently?</Label>
                <Textarea
                  id="previous-meals"
                  placeholder="Tell me about your last few meals to help with variety..."
                  value={mealPrefs.previousMeals}
                  onChange={(e) => setMealPrefs(prev => ({ ...prev, previousMeals: e.target.value }))}
                  rows={3}
                />
              </div>

              <div>
                <Label>How much time do you have today?</Label>
                <RadioGroup 
                  value={mealPrefs.timeAvailable} 
                  onValueChange={(value) => setMealPrefs(prev => ({ ...prev, timeAvailable: value }))}
                  className="mt-2"
                >
                  {timeOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={option.value} />
                      <Label htmlFor={option.value}>{option.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="avoid-today">Anything you want to avoid today?</Label>
                <Input
                  id="avoid-today"
                  placeholder="e.g., fatty foods, spicy dishes, rice..."
                  value={mealPrefs.avoidToday}
                  onChange={(e) => setMealPrefs(prev => ({ ...prev, avoidToday: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle>What cuisine sounds good to you?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {cuisineOptions.map((cuisine) => (
                  <Button
                    key={cuisine}
                    variant={mealPrefs.cuisinePreference === cuisine ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMealPrefs(prev => ({ ...prev, cuisinePreference: cuisine }))}
                    className="text-sm"
                  >
                    {cuisine}
                  </Button>
                ))}
              </div>
              
              {mealPrefs.cuisinePreference && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Great choice! I'll find {mealPrefs.cuisinePreference} dishes that work with your pantry.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-xl font-bold mb-2">Here's what you can make today</h3>
              <p className="text-muted-foreground">
                Based on your pantry and preferences
              </p>
            </div>

            {isLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p>Finding perfect recipes for you...</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {recommendations.map((recipe) => (
                  <Card 
                    key={recipe.id} 
                    className={`cursor-pointer transition-all ${
                      selectedMeal?.id === recipe.id 
                        ? 'ring-2 ring-primary border-primary' 
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => setSelectedMeal(recipe)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-lg">{recipe.name}</h4>
                        <Badge variant="secondary" className="ml-2">
                          {recipe.pantryMatch}% pantry match
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">{recipe.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {recipe.cookTime} min
                        </div>
                        <div className="flex items-center gap-1">
                          <ChefHat className="h-4 w-4" />
                          {recipe.difficulty}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {recipe.cuisine}
                        </div>
                      </div>

                      {recipe.missingIngredients.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            You'll need to get:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {recipe.missingIngredients.map((ingredient, index) => (
                              <span 
                                key={index} 
                                className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full"
                              >
                                {ingredient}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle>When would you like to cook {selectedMeal?.name}?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup 
                value={scheduledTime} 
                onValueChange={setScheduledTime}
              >
                {schedulingOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label htmlFor={option.value} className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              {scheduledTime === 'custom' && (
                <div className="mt-4">
                  <Label htmlFor="custom-time">Pick your preferred time:</Label>
                  <Input
                    id="custom-time"
                    type="datetime-local"
                    className="mt-1"
                  />
                </div>
              )}

              {scheduledTime && selectedMeal && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    Perfect! I'll guide you through making <strong>{selectedMeal.name}</strong> when you're ready.
                    {selectedMeal.missingIngredients.length > 0 && (
                      <span> Don't forget to pick up: {selectedMeal.missingIngredients.join(', ')}.</span>
                    )}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return mealPrefs.previousMeals.trim() !== '' && mealPrefs.timeAvailable !== '';
      case 2: return mealPrefs.cuisinePreference !== '';
      case 3: return selectedMeal !== null;
      case 4: return scheduledTime !== '';
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentStep === 2) {
      generateRecommendations();
    } else if (currentStep === 4 && selectedMeal) {
      onMealSelected(selectedMeal, scheduledTime);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Let's plan your next meal</h2>
        <p className="text-muted-foreground">
          Step {currentStep} of 4 - I'll help you find something delicious to cook
        </p>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300" 
            style={{ width: `${(currentStep / 4) * 100}%` }}
          />
        </div>
      </div>

      {renderCurrentStep()}

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => {
            if (currentStep === 1) {
              onBackToProfile();
            } else {
              setCurrentStep(prev => Math.max(1, prev - 1));
            }
          }}
        >
          {currentStep === 1 ? 'Back to Profile' : 'Previous'}
        </Button>
        
        <Button
          onClick={handleNext}
          disabled={!canProceed() || isLoading}
        >
          {currentStep === 2 ? 'Find Recipes' : 
           currentStep === 4 ? 'Start Cooking' : 'Next'}
        </Button>
      </div>
    </div>
  );
}