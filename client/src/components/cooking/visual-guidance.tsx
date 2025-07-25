import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera } from 'lucide-react';
import { Webcam } from '@/components/ui/webcam';

interface VisualGuidanceProps {
  currentStep: string;
}

interface VisualData {
  detection: string;
  temperature?: string;
  timer?: string;
}

export default function VisualGuidance({ currentStep }: VisualGuidanceProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [visualData, setVisualData] = useState<VisualData>({
    detection: "I'll analyze your cooking when you capture an image",
  });
  const [useLiveImage, setUseLiveImage] = useState(false);

  // Example hardcoded data for demo purposes
  const stepImages: Record<string, string> = {
    "Gather all ingredients and necessary equipment.": "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600",
    "Cook the pasta according to package instructions until al dente.": "https://images.unsplash.com/photo-1551462147-ff29053bfc14?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600",
    "In a separate pan, heat olive oil and sauté garlic until fragrant.": "https://images.unsplash.com/photo-1604149285210-b7eaaa43dea0?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600",
    "Add the shrimp and cook until pink and opaque.": "https://images.unsplash.com/photo-1551248429-40975aa4de74?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600",
    "Add butter, lemon juice, and seasonings to create the sauce.": "https://images.unsplash.com/photo-1532465909-4e0278962a2b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600"
  };

  const handleImageAnalysis = (analysisData: any) => {
    setIsAnalyzing(true);
    
    // In a real app, this would use the actual analyzed data
    // Simulating analysis delay
    setTimeout(() => {
      setVisualData({
        detection: analysisData.description || "This looks like you're cooking the pasta properly. The water is boiling at the right temperature.",
        temperature: "212°F",
        timer: "5:23"
      });
      setIsAnalyzing(false);
    }, 1500);
  };

  return (
    <Card className="mb-6">
      {useLiveImage ? (
        <Webcam onAnalysis={handleImageAnalysis} isAnalyzing={isAnalyzing} />
      ) : (
        <>
          <div className="bg-[#2D3436] p-3 text-white flex justify-between items-center rounded-t-lg">
            <span className="font-medium">Recipe Example</span>
            <button 
              onClick={() => setUseLiveImage(true)}
              className="text-xs bg-primary text-white px-2 py-1 rounded"
            >
              Enable Camera
            </button>
          </div>
          <img 
            src={stepImages[currentStep] || "https://images.unsplash.com/photo-1551462147-ff29053bfc14?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600"}
            alt="Cooking example" 
            className="w-full h-64 object-cover" 
          />
        </>
      )}
      
      <CardContent className="p-4">
        <Alert className="bg-accent/10 mb-4">
          <div className="flex items-center mb-1">
            <Camera className="text-accent mr-2 h-4 w-4" />
            <h4 className="font-bold text-sm">Smart Detection</h4>
          </div>
          <AlertDescription className="text-xs text-gray-500">
            {isAnalyzing ? 
              "Analyzing your cooking..." : 
              visualData.detection}
          </AlertDescription>
        </Alert>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 p-3 rounded-lg text-center">
            <p className="text-xs text-gray-500 mb-1">Temperature</p>
            <p className="font-bold">
              {visualData.temperature || "N/A"}{' '}
              {visualData.temperature && <span className="text-green-500 text-xs">✓</span>}
            </p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg text-center">
            <p className="text-xs text-gray-500 mb-1">Timer</p>
            <p className="font-bold">
              {visualData.timer || "N/A"}{' '}
              {visualData.timer && <span className="text-xs">remaining</span>}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
