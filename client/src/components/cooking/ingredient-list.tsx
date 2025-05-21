import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ClipboardCheck } from 'lucide-react';

interface Ingredient {
  id: string;
  name: string;
  checked: boolean;
  forCurrentStep: boolean;
}

interface IngredientListProps {
  recipeName: string;
  currentStep: number;
  totalSteps: number;
}

export default function IngredientList({ recipeName, currentStep, totalSteps }: IngredientListProps) {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  
  useEffect(() => {
    // In a real app, this would fetch from API based on the recipe
    // Here we're using dummy data
    const dummyIngredients: Ingredient[] = [
      { id: 'ing1', name: '8 oz pasta', checked: true, forCurrentStep: currentStep === 2 },
      { id: 'ing2', name: '2 tsp salt (for pasta water)', checked: true, forCurrentStep: currentStep === 2 },
      { id: 'ing3', name: '4 tbsp butter', checked: false, forCurrentStep: currentStep === 3 || currentStep === 5 },
      { id: 'ing4', name: '1 lb shrimp, peeled and deveined', checked: false, forCurrentStep: currentStep === 4 },
      { id: 'ing5', name: '4 cloves garlic, minced', checked: false, forCurrentStep: currentStep === 3 },
      { id: 'ing6', name: '2 tbsp lemon juice', checked: false, forCurrentStep: currentStep === 5 },
      { id: 'ing7', name: '1/4 cup fresh parsley, chopped', checked: false, forCurrentStep: currentStep === 5 },
      { id: 'ing8', name: 'Salt and pepper to taste', checked: false, forCurrentStep: currentStep === 5 },
    ];
    
    setIngredients(dummyIngredients);
  }, [recipeName, currentStep]);

  const toggleIngredient = (id: string) => {
    setIngredients(prev => 
      prev.map(ing => 
        ing.id === id ? { ...ing, checked: !ing.checked } : ing
      )
    );
  };

  return (
    <Card>
      <CardContent className="p-5">
        <h4 className="font-bold mb-3 flex items-center">
          <ClipboardCheck className="text-primary mr-2 h-5 w-5" /> Ingredients for this step
        </h4>
        
        <div className="space-y-2">
          {ingredients.map(ingredient => (
            <div 
              key={ingredient.id} 
              className={`flex items-center ${!ingredient.forCurrentStep ? 'opacity-50' : ''}`}
            >
              <Checkbox 
                id={ingredient.id} 
                checked={ingredient.checked}
                onCheckedChange={() => toggleIngredient(ingredient.id)}
                disabled={!ingredient.forCurrentStep}
              />
              <label 
                htmlFor={ingredient.id} 
                className="ml-2 text-sm"
                onClick={() => ingredient.forCurrentStep && toggleIngredient(ingredient.id)}
              >
                {ingredient.name}
              </label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
