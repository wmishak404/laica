import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import CookingSteps from '@/components/cooking/cooking-steps';
import VisualGuidance from '@/components/cooking/visual-guidance';
import AIAssistant from '@/components/cooking/ai-assistant';
import IngredientList from '@/components/cooking/ingredient-list';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search } from 'lucide-react';

export default function Cooking() {
  const [location, setLocation] = useLocation();
  const [recipeName, setRecipeName] = useState('');
  const [pantryIngredients, setPantryIngredients] = useState('');
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [recipeOptions, setRecipeOptions] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [currentStepNumber, setCurrentStepNumber] = useState(1);
  const [totalSteps, setTotalSteps] = useState(5);
  const { toast } = useToast();

  // Extract recipe ID from URL if present
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1]);
    const recipeId = params.get('recipe');
    
    if (recipeId) {
      setIsLoading(true);
      // In a real app, fetch the recipe details using the ID
      // For now, simulate loading with sample data
      setTimeout(() => {
        setRecipeName('Garlic Butter Shrimp Pasta');
        setIsLoading(false);
      }, 800);
    }
  }, [location]);

  const handleDietaryChange = (preference: string) => {
    setDietaryPreferences(prev => 
      prev.includes(preference) 
        ? prev.filter(p => p !== preference) 
        : [...prev, preference]
    );
  };
  
  const handleTimeSelect = (time: string) => {
    setSelectedTime(prev => prev === time ? null : time);
  };
  
  const handleFindMeals = async () => {
    if (!pantryIngredients.trim()) {
      toast({
        title: "Ingredients required",
        description: "Please enter some ingredients from your pantry",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Convert comma-separated ingredients to array
      const ingredients = pantryIngredients
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);
      
      // Format dietary preferences as a string
      const preferences = dietaryPreferences.length > 0 
        ? dietaryPreferences.join(', ') 
        : '';
      
      // For demonstration, we'll use mock data
      // In a production app, you would use fetchPantryRecipes() API call
      setTimeout(() => {
        // Example recipe results
        const mockResults = [
          {
            name: "Quick Veggie Stir Fry",
            description: "A delicious stir fry using whatever vegetables you have on hand",
            difficulty: "Easy",
            cookTime: 20,
            pantryIngredientsUsed: ingredients.slice(0, 3),
            additionalIngredientsNeeded: ["soy sauce", "sesame oil"]
          },
          {
            name: "Pantry Pasta",
            description: "Simple pasta dish with minimal ingredients",
            difficulty: "Easy",
            cookTime: 15,
            pantryIngredientsUsed: ingredients.slice(0, 2),
            additionalIngredientsNeeded: ["dried herbs"]
          },
          {
            name: "Kitchen Sink Frittata",
            description: "Use up vegetables and proteins in a simple egg dish",
            difficulty: "Medium",
            cookTime: 25,
            pantryIngredientsUsed: ingredients.slice(0, 4),
            additionalIngredientsNeeded: ["cheese"]
          }
        ];
        
        setRecipeOptions(mockResults);
        setShowResults(true);
        setIsLoading(false);
      }, 1500);
    } catch (error) {
      console.error('Error finding meal ideas:', error);
      toast({
        title: "Error finding recipes",
        description: "There was a problem suggesting meals. Please try again.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };
  
  const handleSelectRecipe = (recipe: string) => {
    setRecipeName(recipe);
    setShowResults(false);
  };

  const handleStepChange = (step: number, total: number) => {
    setCurrentStepNumber(step);
    setTotalSteps(total);
    
    // Set steps array to match the steps from CookingSteps component
    // This would be more properly handled with a shared state or context in a larger app
    const stepsArray = [
      "Gather all ingredients and necessary equipment.",
      "Cook the pasta according to package instructions until al dente.",
      "In a separate pan, heat olive oil and sauté garlic until fragrant.",
      "Add the shrimp and cook until pink and opaque.",
      "Add butter, lemon juice, and seasonings to create the sauce."
    ];
    
    if (step > 0 && step <= stepsArray.length) {
      setCurrentStep(stepsArray[step - 1]);
    }
  };

  return (
    <>
      <Header />
      <main>
        <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-6 md:py-8">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Cooking Assistant</h1>
            <p className="text-lg mb-4">Follow step-by-step guidance with your AI cooking companion</p>
          </div>
        </section>

        <section className="py-8 md:py-12 bg-white">
          <div className="container mx-auto px-4">
            {!recipeName ? (
              <div>
                {!showResults ? (
                  <Card className="max-w-2xl mx-auto">
                    <CardContent className="p-6">
                      <h2 className="text-2xl font-bold mb-4">What's in Your Kitchen?</h2>
                      <p className="mb-6 text-gray-600">Tell us what ingredients you have, and we'll suggest what you can make</p>
                      
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-md font-semibold mb-2">Your Pantry Ingredients</h3>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <Input
                              placeholder="Enter ingredients separated by commas (e.g., chicken, rice, onions, garlic)"
                              className="pl-10"
                              value={pantryIngredients}
                              onChange={(e) => setPantryIngredients(e.target.value)}
                            />
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-md font-semibold mb-2">Dietary Preferences (Optional)</h3>
                          <div className="grid grid-cols-2 gap-2">
                            {['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free'].map(pref => (
                              <div key={pref} className="flex items-center space-x-2">
                                <Checkbox 
                                  id={`pref-${pref.toLowerCase()}`} 
                                  checked={dietaryPreferences.includes(pref)}
                                  onCheckedChange={() => handleDietaryChange(pref)}
                                />
                                <label htmlFor={`pref-${pref.toLowerCase()}`} className="text-sm">{pref}</label>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-md font-semibold mb-2">Time Available</h3>
                          <div className="flex space-x-2">
                            {['15 min', '30 min', '45 min', '60+ min'].map(time => (
                              <Button 
                                key={time} 
                                variant={selectedTime === time ? "default" : "outline"} 
                                size="sm" 
                                className={`flex-1 ${selectedTime === time ? 'bg-secondary text-white' : ''}`}
                                onClick={() => handleTimeSelect(time)}
                              >
                                {time}
                              </Button>
                            ))}
                          </div>
                        </div>
                        
                        <Button 
                          onClick={handleFindMeals} 
                          className="w-full bg-primary text-white"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Finding Meals...
                            </>
                          ) : (
                            'Find Meals I Can Make'
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="max-w-4xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold">Meals You Can Make</h2>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowResults(false)}
                      >
                        Change Ingredients
                      </Button>
                    </div>
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {recipeOptions.map((recipe, index) => (
                        <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                          <div className="aspect-video bg-gray-100 relative flex items-center justify-center">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                            <div className="absolute bottom-3 left-3 z-20">
                              <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">
                                {recipe.difficulty} • {recipe.cookTime} min
                              </span>
                            </div>
                          </div>
                          <CardContent className="p-5">
                            <h3 className="font-bold text-lg mb-2">{recipe.name}</h3>
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{recipe.description}</p>
                            
                            <div className="mb-3">
                              <h4 className="text-xs font-semibold text-gray-500 mb-1">Using from your pantry:</h4>
                              <div className="flex flex-wrap gap-1 mb-2">
                                {recipe.pantryIngredientsUsed.map((ing, i) => (
                                  <span key={i} className="bg-secondary/10 text-secondary text-xs px-2 py-0.5 rounded-full">
                                    {ing}
                                  </span>
                                ))}
                              </div>
                            </div>
                            
                            {recipe.additionalIngredientsNeeded.length > 0 && (
                              <div className="mb-4">
                                <h4 className="text-xs font-semibold text-gray-500 mb-1">You'll also need:</h4>
                                <div className="flex flex-wrap gap-1">
                                  {recipe.additionalIngredientsNeeded.map((ing, i) => (
                                    <span key={i} className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full">
                                      {ing}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            <Button 
                              onClick={() => handleSelectRecipe(recipe.name)}
                              className="w-full mt-2"
                            >
                              Start Cooking
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Left side - Recipe and Steps */}
                <div className="lg:w-1/2">
                  <CookingSteps 
                    recipeName={recipeName} 
                    onStepChange={handleStepChange}
                  />
                  
                  <AIAssistant 
                    currentStep={currentStep} 
                    isStepChanging={false}
                  />
                </div>
                
                {/* Right side - Visual Guidance */}
                <div className="lg:w-1/2">
                  <VisualGuidance 
                    currentStep={currentStep}
                  />
                  
                  <IngredientList 
                    recipeName={recipeName}
                    currentStep={currentStepNumber}
                    totalSteps={totalSteps}
                  />
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
