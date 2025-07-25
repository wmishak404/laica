import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Mic, MicOff, Camera, CameraOff, Play, Pause, SkipForward, SkipBack, AlertTriangle, Info, CheckCircle, ExternalLink, Volume2, VolumeX, Settings, Monitor, Smartphone, Clock, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { fetchCookingSteps, fetchCookingAssistance } from '@/lib/openai';

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
  const [cameraMode, setCameraMode] = useState<'front' | 'back'>('back');
  const [cameraTimeout, setCameraTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showCameraFeed, setShowCameraFeed] = useState(true);
  const [assistantResponse, setAssistantResponse] = useState<string>('Welcome! Let\'s start cooking your delicious meal together. I\'m here to guide you through each step.');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [timer, setTimer] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [captionSize, setCaptionSize] = useState(16);
  const [showDemoVideo, setShowDemoVideo] = useState(false);
  const [demoVideoUrl, setDemoVideoUrl] = useState('');
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [loadedRecipeSteps, setLoadedRecipeSteps] = useState<RecipeStep[]>([]);
  const [isLoadingSteps, setIsLoadingSteps] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);

  // Load recipe steps when component mounts
  useEffect(() => {
    const loadRecipeSteps = async () => {
      setIsLoadingSteps(true);
      try {
        const response = await fetchCookingSteps(selectedMeal.name);
        const steps: RecipeStep[] = response.steps?.map((step: any, index: number) => ({
          id: index + 1,
          instruction: step.instruction || '',
          duration: step.duration,
          tips: step.tips || '',
          visualCues: step.visualCues || '',
          commonMistakes: step.commonMistakes || '',
          safetyLevel: step.safetyLevel || 'minor'
        })) || [];
        setLoadedRecipeSteps(steps);
        
        // Set initial assistant response
        if (steps.length > 0) {
          setAssistantResponse(`Great! I've prepared ${steps.length} steps for cooking ${selectedMeal.name}. Are you ready to begin? Let's start with step 1: ${steps[0].instruction}`);
        }
      } catch (error) {
        console.error('Error loading recipe steps:', error);
        // Fallback to basic steps
        setLoadedRecipeSteps([
          {
            id: 1,
            instruction: `Prepare ingredients for ${selectedMeal.name}`,
            tips: 'Gather all ingredients and prep workspace',
            visualCues: 'All ingredients should be within reach',
            commonMistakes: 'Not having everything ready before starting',
            safetyLevel: 'important'
          },
          {
            id: 2,
            instruction: `Begin cooking ${selectedMeal.name}`,
            tips: 'Follow the recipe step by step',
            visualCues: 'Start with the base ingredients',
            commonMistakes: 'Rushing the cooking process',
            safetyLevel: 'important'
          }
        ]);
        setAssistantResponse(`I've prepared basic steps for ${selectedMeal.name}. Let's start cooking together!`);
      } finally {
        setIsLoadingSteps(false);
      }
    };

    loadRecipeSteps();
    
    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      speechSynthesisRef.current = window.speechSynthesis;
    }
  }, [selectedMeal.name]);

  // Use loaded steps
  const currentRecipeSteps = loadedRecipeSteps;
  const currentStep = currentRecipeSteps[currentStepIndex];
  const progress = currentRecipeSteps.length > 0 ? ((currentStepIndex + 1) / currentRecipeSteps.length) * 100 : 0;

  // Timer effect
  useEffect(() => {
    if (isTimerRunning && timer > 0) {
      timerRef.current = setTimeout(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    } else if (timer === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      speakText("Time's up! Check your cooking and let me know how it looks.");
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timer, isTimerRunning]);

  // Camera timeout for back camera mode
  useEffect(() => {
    if (cameraMode === 'back' && showCameraFeed) {
      const timeout = setTimeout(() => {
        setShowCameraFeed(false);
      }, 10000); // 10 seconds timeout
      setCameraTimeout(timeout);
      
      return () => {
        if (timeout) clearTimeout(timeout);
      };
    }
  }, [cameraMode, showCameraFeed]);

  // Text-to-speech function
  const speakText = (text: string) => {
    if (isAudioEnabled && speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel(); // Stop any current speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      speechSynthesisRef.current.speak(utterance);
    }
  };

  // Speak assistant response when it changes
  useEffect(() => {
    if (assistantResponse) {
      speakText(assistantResponse);
    }
  }, [assistantResponse, isAudioEnabled]);

  const nextStep = () => {
    if (currentStepIndex < currentRecipeSteps.length - 1) {
      const newStepIndex = currentStepIndex + 1;
      setCurrentStepIndex(newStepIndex);
      const nextStepData = currentRecipeSteps[newStepIndex];
      setTimer(nextStepData?.duration || 0);
      setIsTimerRunning(false);
      
      const stepText = `Step ${newStepIndex + 1}: ${nextStepData.instruction}. ${nextStepData.tips}`;
      setAssistantResponse(stepText);
    } else {
      setAssistantResponse("Congratulations! You've completed all the cooking steps. Your meal should be ready to enjoy!");
    }
  };

  const previousStep = () => {
    if (currentStepIndex > 0) {
      const newStepIndex = currentStepIndex - 1;
      setCurrentStepIndex(newStepIndex);
      const prevStepData = currentRecipeSteps[newStepIndex];
      setTimer(prevStepData?.duration || 0);
      setIsTimerRunning(false);
      
      const stepText = `Back to step ${newStepIndex + 1}: ${prevStepData.instruction}`;
      setAssistantResponse(stepText);
    }
  };

  const startTimer = (minutes: number) => {
    setTimer(minutes * 60);
    setIsTimerRunning(true);
    setAssistantResponse(`Timer set for ${minutes} minutes. I'll let you know when time is up!`);
  };

  const toggleListening = () => {
    setIsListening(!isListening);
    if (!isListening) {
      setAssistantResponse("I'm listening! You can ask me questions about the current step or tell me how things are going.");
    } else {
      setAssistantResponse("Okay, I've stopped listening. Tap the microphone when you need help!");
    }
  };

  const askForHelp = async (question?: string) => {
    if (!currentStep) return;
    
    setIsProcessing(true);
    try {
      const response = await fetchCookingAssistance(currentStep.instruction, question);
      // Handle response from API - it may be a string or object
      setAssistantResponse(response || "I'm here to help! Can you tell me more about what you're having trouble with?");
    } catch (error) {
      console.error('Error getting cooking assistance:', error);
      setAssistantResponse("I'm having trouble connecting right now, but let me give you a general tip: take your time with this step and follow the visual cues I mentioned.");
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleCameraFeed = () => {
    setShowCameraFeed(!showCameraFeed);
    if (cameraMode === 'back') {
      // Reset timeout when manually toggling
      if (cameraTimeout) {
        clearTimeout(cameraTimeout);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSafetyColor = (level: 'critical' | 'important' | 'minor') => {
    switch (level) {
      case 'critical': return 'bg-red-100 border-red-500 text-red-700';
      case 'important': return 'bg-yellow-100 border-yellow-500 text-yellow-700';
      case 'minor': return 'bg-blue-100 border-blue-500 text-blue-700';
    }
  };

  const getSafetyIcon = (level: 'critical' | 'important' | 'minor') => {
    switch (level) {
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      case 'important': return <Info className="h-4 w-4" />;
      case 'minor': return <CheckCircle className="h-4 w-4" />;
    }
  };

  if (isLoadingSteps) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4 min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B6B] mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Preparing Your Cooking Guide</h2>
          <p className="text-gray-600">Setting up personalized step-by-step instructions for {selectedMeal.name}...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 min-h-screen bg-gray-900 text-white relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 bg-black/50 p-4 rounded-lg">
        <Button 
          variant="ghost" 
          onClick={onBackToPlanning}
          className="text-white hover:bg-white/20"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Planning
        </Button>
        
        <div className="text-center">
          <h1 className="text-xl font-bold">{selectedMeal.name}</h1>
          <p className="text-sm text-gray-300">Live Cooking Assistant</p>
        </div>

        <Button 
          variant="ghost" 
          onClick={() => setShowSettings(!showSettings)}
          className="text-white hover:bg-white/20"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <Card className="mb-4 bg-black/70 border-gray-600">
          <CardHeader>
            <CardTitle className="text-white">Camera & Audio Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-white">Camera Mode</Label>
              <div className="flex gap-2">
                <Button
                  variant={cameraMode === 'front' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCameraMode('front')}
                  className="text-xs"
                >
                  <Monitor className="h-3 w-3 mr-1" />
                  Front
                </Button>
                <Button
                  variant={cameraMode === 'back' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCameraMode('back')}
                  className="text-xs"
                >
                  <Smartphone className="h-3 w-3 mr-1" />
                  Back
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <Label className="text-white">Audio Guidance</Label>
              <Switch
                checked={isAudioEnabled}
                onCheckedChange={setIsAudioEnabled}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-white">Caption Size: {captionSize}px</Label>
              <Slider
                value={[captionSize]}
                onValueChange={(value) => setCaptionSize(value[0])}
                min={12}
                max={24}
                step={2}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Camera Feed / Demo Video Area */}
        <div className="lg:col-span-2">
          {showDemoVideo ? (
            <Card className="bg-black border-gray-600 h-64 lg:h-96">
              <CardContent className="p-0 h-full">
                <div className="relative h-full bg-black rounded-lg flex items-center justify-center">
                  <p className="text-white">Demo Video Player</p>
                  <Button
                    variant="ghost"
                    className="absolute top-2 right-2 text-white"
                    onClick={() => setShowDemoVideo(false)}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-black border-gray-600 h-64 lg:h-96">
              <CardContent className="p-0 h-full relative">
                {(cameraMode === 'front' || showCameraFeed) ? (
                  <div className="h-full bg-gray-800 rounded-lg flex items-center justify-center relative">
                    <Camera className="h-12 w-12 text-gray-400" />
                    <p className="text-gray-400 mt-2 absolute bottom-4">Camera feed would appear here</p>
                    
                    {cameraMode === 'back' && (
                      <div className="absolute bottom-2 left-2 text-xs text-gray-300 bg-black/50 px-2 py-1 rounded">
                        Tap screen to show camera (10s timeout)
                      </div>
                    )}
                  </div>
                ) : (
                  <div 
                    className="h-full bg-gray-900 rounded-lg flex items-center justify-center cursor-pointer"
                    onClick={toggleCameraFeed}
                  >
                    <div className="text-center">
                      <CameraOff className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">Tap to show camera</p>
                    </div>
                  </div>
                )}
                
                {/* Processing Overlay */}
                {(isProcessing || isAnalyzing) && (
                  <div className="absolute inset-0 bg-black/75 flex items-center justify-center rounded-lg">
                    <div className="text-center text-white">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                      <p className="text-sm">
                        {isProcessing ? 'Processing your question...' : 'Analyzing cooking progress...'}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Step Information */}
        <div className="space-y-4">
          {currentStep && (
            <Card className="bg-black/70 border-gray-600">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-lg">
                    Step {currentStepIndex + 1} of {currentRecipeSteps.length}
                  </CardTitle>
                  <Badge className={getSafetyColor(currentStep.safetyLevel)}>
                    {getSafetyIcon(currentStep.safetyLevel)}
                    <span className="ml-1 capitalize">{currentStep.safetyLevel}</span>
                  </Badge>
                </div>
                <Progress value={progress} className="w-full" />
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-white font-medium">{currentStep.instruction}</p>
                
                {currentStep.visualCues && (
                  <Alert className="bg-blue-900/50 border-blue-500">
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-blue-100">
                      <strong>Look for:</strong> {currentStep.visualCues}
                    </AlertDescription>
                  </Alert>
                )}
                
                {currentStep.tips && (
                  <Alert className="bg-green-900/50 border-green-500">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription className="text-green-100">
                      <strong>Pro tip:</strong> {currentStep.tips}
                    </AlertDescription>
                  </Alert>
                )}
                
                {currentStep.commonMistakes && (
                  <Alert className="bg-yellow-900/50 border-yellow-500">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-yellow-100">
                      <strong>Avoid:</strong> {currentStep.commonMistakes}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Timer */}
                {currentStep.duration && (
                  <div className="bg-gray-800 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">
                        <Clock className="h-4 w-4 inline mr-1" />
                        Timer: {formatTime(timer)}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => setIsTimerRunning(!isTimerRunning)}
                        variant={isTimerRunning ? "destructive" : "default"}
                      >
                        {isTimerRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startTimer(currentStep.duration! / 60)}
                      className="w-full"
                    >
                      Start {currentStep.duration / 60} min timer
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Navigation Controls */}
          <Card className="bg-black/70 border-gray-600">
            <CardContent className="p-4">
              <div className="flex justify-between gap-2">
                <Button
                  variant="outline"
                  onClick={previousStep}
                  disabled={currentStepIndex === 0}
                  className="flex-1"
                >
                  <SkipBack className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={nextStep}
                  disabled={currentStepIndex >= currentRecipeSteps.length - 1}
                  className="flex-1"
                >
                  Next
                  <SkipForward className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Audio Controls */}
      <Card className="bg-black/70 border-gray-600 mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-4">
            <Button
              variant={isListening ? "destructive" : "default"}
              onClick={toggleListening}
              className="flex-1 max-w-xs"
            >
              {isListening ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
              {isListening ? 'Stop Listening' : 'Ask for Help'}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => askForHelp()}
              disabled={isProcessing}
              className="flex-1 max-w-xs"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Processing...
                </>
              ) : (
                'Get Guidance'
              )}
            </Button>

            <Button
              variant="ghost"
              onClick={() => setIsAudioEnabled(!isAudioEnabled)}
              className="text-white"
            >
              {isAudioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Closed Captioning */}
      <Card className="bg-black/90 border-gray-600 sticky bottom-4">
        <CardContent className="p-4">
          <div className="text-center">
            <p 
              className="text-white leading-relaxed"
              style={{ fontSize: `${captionSize}px` }}
            >
              {assistantResponse}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}