import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle } from 'lucide-react';

interface VisualGuidanceProps {
  currentStep: string;
}


export default function VisualGuidance({ currentStep }: VisualGuidanceProps) {

  // Example hardcoded data for demo purposes
  const stepImages: Record<string, string> = {
    "Gather all ingredients and necessary equipment.": "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600",
    "Cook the pasta according to package instructions until al dente.": "https://images.unsplash.com/photo-1551462147-ff29053bfc14?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600",
    "In a separate pan, heat olive oil and sauté garlic until fragrant.": "https://images.unsplash.com/photo-1604149285210-b7eaaa43dea0?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600",
    "Add the shrimp and cook until pink and opaque.": "https://images.unsplash.com/photo-1551248429-40975aa4de74?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600",
    "Add butter, lemon juice, and seasonings to create the sauce.": "https://images.unsplash.com/photo-1532465909-4e0278962a2b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600"
  };


  return (
    <Card className="mb-6">
      <div className="bg-[#2D3436] p-3 text-white flex justify-between items-center rounded-t-lg">
        <span className="font-medium">Recipe Example</span>
      </div>
      <img 
        src={stepImages[currentStep] || "https://images.unsplash.com/photo-1551462147-ff29053bfc14?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600"}
        alt="Cooking example" 
        className="w-full h-64 object-cover" 
      />
      
      <CardContent className="p-4">
        <Alert className="bg-accent/10 mb-4">
          <div className="flex items-center mb-1">
            <CheckCircle className="text-accent mr-2 h-4 w-4" />
            <h4 className="font-bold text-sm">Recipe Visual Guide</h4>
          </div>
          <AlertDescription className="text-xs text-gray-500">
            Visual examples to help you follow along with the cooking process
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
