import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Webcam } from '@/components/ui/webcam';
import { Mic, MicOff, Camera, Play, Pause, SkipForward, AlertTriangle, Info, CheckCircle, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface RecipeStep {
  id: number;
  instruction: string;
  duration?: number;
  tips: string;
  visualCues: string;
  commonMistakes: string;
  safetyLevel: 'critical' | 'important' | 'minor';
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

interface LiveCookingProps {
  selectedMeal: RecipeRecommendation;
  scheduledTime: string;
  onBackToPlanning: () => void;
}

export default function LiveCooking({ selectedMeal, scheduledTime, onBackToPlanning }: LiveCookingProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [showCamera, setShowCamera] = useState(true);
  const [aiResponse, setAiResponse] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [timer, setTimer] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Mock recipe steps - in production this would come from your LLM
  const recipeSteps: RecipeStep[] = [
    {
      id: 1,
      instruction: "Gather all your ingredients and prep your workspace. Check that you have everything needed.",
      tips: "Mise en place is key - having everything ready makes cooking smoother and safer",
      visualCues: "All ingredients should be measured and within easy reach",
      commonMistakes: "Starting without checking all ingredients first",
      safetyLevel: 'minor'
    },
    {
      id: 2,
      instruction: "Heat your pan over medium heat. Add a tablespoon of oil when the pan is warm.",
      tips: "Test the heat by dropping a small amount of water - it should sizzle gently",
      visualCues: "Oil should shimmer but not smoke",
      commonMistakes: "Using high heat which can burn ingredients",
      safetyLevel: 'important'
    },
    {
      id: 3,
      instruction: "Add your aromatics (garlic, onions) to the pan. Cook until fragrant, about 1-2 minutes.",
      duration: 120,
      tips: "Garlic should be golden, not brown - brown garlic tastes bitter",
      visualCues: "You should hear gentle sizzling and smell the aromatics",
      commonMistakes: "Burning the garlic by using too high heat",
      safetyLevel: 'important'
    }
  ];

  const currentStep = recipeSteps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / recipeSteps.length) * 100;

  useEffect(() => {
    if (isTimerRunning && timer > 0) {
      timerRef.current = setTimeout(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    } else if (timer === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      // Could play a sound or show notification here
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timer, isTimerRunning]);

  const startTimer = (seconds: number) => {
    setTimer(seconds);
    setIsTimerRunning(true);
  };

  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const handleVisualAnalysis = async (analysisData: any) => {
    setIsAnalyzing(true);
    
    // In production, this would send the image to your LLM for analysis
    // For now, providing realistic feedback based on current step
    setTimeout(() => {
      let response = '';
      
      switch (currentStepIndex) {
        case 0:
          response = "Good! I can see your ingredients are laid out. Make sure your cutting board is stable and your knife is sharp for safer prep.";
          break;
        case 1:
          response = "Your pan looks ready! The oil has a nice shimmer - perfect temperature for adding ingredients.";
          break;
        case 2:
          response = "Great sizzling sound! Your garlic is getting golden - you're right on track. Don't let it get too brown.";
          break;
        default:
          response = "Looking good! Keep following the visual cues and you'll do great.";
      }
      
      setAiResponse(response);
      setIsAnalyzing(false);
    }, 2000);
  };

  const nextStep = () => {
    if (currentStepIndex < recipeSteps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
      setAiResponse(''); // Clear previous AI response
    }
  };

  const previousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
      setAiResponse('');
    }
  };

  const getSafetyIcon = (level: string) => {
    switch (level) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'important':
        return <Info className="h-4 w-4 text-yellow-500" />;
      case 'minor':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  const getSafetyColor = (level: string) => {
    switch (level) {
      case 'critical': return 'border-red-200 bg-red-50';
      case 'important': return 'border-yellow-200 bg-yellow-50';
      case 'minor': return 'border-green-200 bg-green-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Cooking: {selectedMeal.name}</h2>
        <div className="flex justify-center items-center gap-4">
          <Badge variant="secondary">Step {currentStepIndex + 1} of {recipeSteps.length}</Badge>
          <Progress value={progress} className="w-48" />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column - Instructions & AI Guidance */}
        <div className="space-y-4">
          {/* Current Step */}
          <Card className={`border-2 ${getSafetyColor(currentStep.safetyLevel)}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  {getSafetyIcon(currentStep.safetyLevel)}
                  Step {currentStep.id}
                </CardTitle>
                {currentStep.duration && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono">
                      {formatTime(timer)}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => timer > 0 ? toggleTimer() : startTimer(currentStep.duration!)}
                    >
                      {timer > 0 ? (isTimerRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />) : <Play className="h-3 w-3" />}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-base leading-relaxed">{currentStep.instruction}</p>
              
              <Alert className="border-blue-200 bg-blue-50">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Tip:</strong> {currentStep.tips}
                </AlertDescription>
              </Alert>

              <div className="text-sm space-y-1">
                <p><strong>Look for:</strong> {currentStep.visualCues}</p>
                <p><strong>Avoid:</strong> {currentStep.commonMistakes}</p>
              </div>
            </CardContent>
          </Card>

          {/* AI Response */}
          {aiResponse && (
            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">AI</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-purple-800">{aiResponse}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Controls */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={previousStep}
              disabled={currentStepIndex === 0}
            >
              Previous Step
            </Button>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsListening(!isListening)}
                className={isListening ? 'bg-red-50 border-red-200' : ''}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                {isListening ? 'Stop Listening' : 'Ask Question'}
              </Button>
              
              <Button
                onClick={nextStep}
                disabled={currentStepIndex === recipeSteps.length - 1}
              >
                <SkipForward className="h-4 w-4 mr-1" />
                Next Step
              </Button>
            </div>
          </div>

          {/* Need Help Section */}
          <Card className="border-gray-200">
            <CardContent className="pt-4">
              <h4 className="font-medium mb-2">Need help with this technique?</h4>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => {
                  // In production, this would search for relevant YouTube videos
                  window.open(`https://www.youtube.com/results?search_query=how+to+cook+garlic+properly`, '_blank');
                }}
              >
                <ExternalLink className="h-3 w-3" />
                Watch Tutorial Video
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Camera Feed */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Live Cooking View</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCamera(!showCamera)}
                >
                  <Camera className="h-4 w-4 mr-1" />
                  {showCamera ? 'Hide' : 'Show'} Camera
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showCamera ? (
                <div className="space-y-3">
                  <Webcam 
                    onAnalysis={handleVisualAnalysis} 
                    isAnalyzing={isAnalyzing}
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    I'm watching your cooking and will give feedback to help you succeed
                  </p>
                </div>
              ) : (
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">Camera is off</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recipe Overview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Recipe Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Time:</span>
                  <span>{selectedMeal.cookTime} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span>Difficulty:</span>
                  <span>{selectedMeal.difficulty}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cuisine:</span>
                  <span>{selectedMeal.cuisine}</span>
                </div>
                <div className="flex justify-between">
                  <span>Progress:</span>
                  <span>{Math.round(progress)}% complete</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={onBackToPlanning}
        >
          Back to Meal Planning
        </Button>
      </div>
    </div>
  );
}