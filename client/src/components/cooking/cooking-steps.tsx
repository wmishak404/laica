import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Clock, Users, StepBack, StepForward } from 'lucide-react';
import { fetchCookingSteps } from '@/lib/openai';

interface CookingStepsProps {
  recipeName: string;
  onStepChange?: (step: number, totalSteps: number) => void;
}

export default function CookingSteps({ recipeName, onStepChange }: CookingStepsProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [steps, setSteps] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    const loadSteps = async () => {
      try {
        setIsLoading(true);
        const response = await fetchCookingSteps(recipeName);
        if (response.steps && Array.isArray(response.steps)) {
          // Transform the steps if they have a complex structure
          const formattedSteps = response.steps.map(step => {
            if (typeof step === 'string') {
              return step;
            } else if (typeof step === 'object') {
              // If step is an object with instruction property, extract it
              return step.instruction || step.step || JSON.stringify(step);
            }
            return String(step);
          });
          
          setSteps(formattedSteps);
          setProgress((1 / formattedSteps.length) * 100);
          if (onStepChange) {
            onStepChange(1, formattedSteps.length);
          }
        } else {
          // Fallback steps if API call fails
          const fallbackSteps = [
            "Gather all ingredients and necessary equipment.",
            "Cook the pasta according to package instructions until al dente.",
            "In a separate pan, heat olive oil and sauté garlic until fragrant.",
            "Add the shrimp and cook until pink and opaque.",
            "Add butter, lemon juice, and seasonings to create the sauce."
          ];
          setSteps(fallbackSteps);
          setProgress((1 / fallbackSteps.length) * 100);
          if (onStepChange) {
            onStepChange(1, fallbackSteps.length);
          }
        }
      } catch (error) {
        console.error('Error loading cooking steps:', error);
        // Set fallback steps
        const fallbackSteps = [
          "Gather all ingredients and necessary equipment.",
          "Cook the pasta according to package instructions until al dente.",
          "In a separate pan, heat olive oil and sauté garlic until fragrant.",
          "Add the shrimp and cook until pink and opaque.",
          "Add butter, lemon juice, and seasonings to create the sauce."
        ];
        setSteps(fallbackSteps);
        setProgress((1 / fallbackSteps.length) * 100);
        if (onStepChange) {
          onStepChange(1, fallbackSteps.length);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadSteps();
  }, [recipeName, onStepChange]);

  const handleNextStep = () => {
    if (currentStep < steps.length) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      setProgress((newStep / steps.length) * 100);
      if (onStepChange) {
        onStepChange(newStep, steps.length);
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      setProgress((newStep / steps.length) * 100);
      if (onStepChange) {
        onStepChange(newStep, steps.length);
      }
    }
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-5">
        <h3 className="recipe-title text-xl font-bold mb-2">{recipeName}</h3>
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <span className="mr-4 flex items-center"><Clock className="h-4 w-4 mr-1" /> 25 min</span>
          <span className="flex items-center"><Users className="h-4 w-4 mr-1" /> 2 servings</span>
        </div>
        
        {isLoading ? (
          <div className="border-t border-gray-200 pt-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        ) : (
          <div className="border-t border-gray-200 pt-4">
            <h4 className="font-bold mb-2">Current Step:</h4>
            <p className="mb-3 font-medium">{steps[currentStep - 1]}</p>
            
            <div className="relative pt-1 mb-4">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block text-primary">
                    Step {currentStep} of {steps.length}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-primary">
                    {Math.round(progress)}%
                  </span>
                </div>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            
            <div className="flex gap-2 mb-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handlePrevStep}
                disabled={currentStep <= 1}
                className="px-4 py-2 border border-gray-200 rounded text-sm hover:bg-gray-50 transition"
              >
                <StepBack className="h-4 w-4 mr-1" /> Previous
              </Button>
              <Button 
                className="px-4 py-2 bg-primary text-white rounded text-sm hover:bg-primary/90 transition flex-1"
                size="sm"
                onClick={handleNextStep}
                disabled={currentStep >= steps.length}
              >
                <StepForward className="h-4 w-4 mr-1" /> Next Step
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
