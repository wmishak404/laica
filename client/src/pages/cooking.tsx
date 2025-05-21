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
  const [recipeSearch, setRecipeSearch] = useState('');
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

  const handleStartCooking = () => {
    if (!recipeSearch.trim()) {
      toast({
        title: "Recipe name required",
        description: "Please enter a recipe name to start cooking",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    // Simulating a loading delay
    setTimeout(() => {
      setRecipeName(recipeSearch);
      setIsLoading(false);
    }, 1000);
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
                          value={recipeSearch}
                          onChange={(e) => setRecipeSearch(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-md font-semibold mb-2">Dietary Preferences (Optional)</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free'].map(pref => (
                          <div key={pref} className="flex items-center space-x-2">
                            <Checkbox id={`pref-${pref.toLowerCase()}`} />
                            <label htmlFor={`pref-${pref.toLowerCase()}`} className="text-sm">{pref}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-md font-semibold mb-2">Time Available</h3>
                      <div className="flex space-x-2">
                        {['15 min', '30 min', '45 min', '60+ min'].map(time => (
                          <Button key={time} variant="outline" size="sm" className="flex-1">
                            {time}
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    <Button 
                      onClick={handleStartCooking} 
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
