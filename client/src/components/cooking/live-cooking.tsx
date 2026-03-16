import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Mic, MicOff, Play, Pause, SkipForward, SkipBack, AlertTriangle, Info, CheckCircle, ExternalLink, Volume2, VolumeX, Clock, ArrowLeft, MessageCircle, Repeat, StopCircle, Pin, PinOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { fetchCookingSteps, fetchCookingAssistance } from '@/lib/openai';
import { withDemoErrorHandling } from '@/lib/rateLimitHandler';
import { elevenLabsClient, browserTTSClient, COOKING_VOICE_SETTINGS, type VoiceSettings } from '@/lib/elevenlabs';
import { AudioProcessor } from '@/lib/audioUtils';
import { UsageTracker } from '@/lib/usageTracker';
import { useStartCookingSession, useUpdateCookingSession, useCompleteCookingSession } from '@/hooks/useCookingSession';
import { useToast } from '@/hooks/use-toast';

const COOKING_SESSION_STORAGE_KEY = 'laica_cooking_session';

interface SavedCookingSession {
  recipeName: string;
  recipeId: string;
  currentStepIndex: number;
  timer: number;
  isTimerRunning: boolean;
  savedAt: number;
}

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
  recipeName: string;
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
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [voiceProcessingTimeout, setVoiceProcessingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [silenceTimeout, setSilenceTimeout] = useState<NodeJS.Timeout | null>(null);
  const [shouldProcessRecording, setShouldProcessRecording] = useState(true);
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
  const [useElevenLabs, setUseElevenLabs] = useState(true);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(COOKING_VOICE_SETTINGS);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingTimer, setRecordingTimer] = useState<NodeJS.Timeout | null>(null);
  const [usageStats, setUsageStats] = useState(UsageTracker.getUsageStats());
  const [cookingSessionId, setCookingSessionId] = useState<number | null>(null);
  const [cookingStartTime, setCookingStartTime] = useState<Date | null>(null);
  const [voiceAvailable, setVoiceAvailable] = useState(true);
  const [voiceErrorShown, setVoiceErrorShown] = useState(false);
  const [audioContextInitialized, setAudioContextInitialized] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [isTranscriptionPinned, setIsTranscriptionPinned] = useState(() => {
    const saved = localStorage.getItem('laica_transcription_pinned');
    return saved !== null ? JSON.parse(saved) : true; // Default: pinned
  });
  const transcriptionRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);

  const { toast } = useToast();
  const startSessionMutation = useStartCookingSession();
  const updateSessionMutation = useUpdateCookingSession();
  const completeSessionMutation = useCompleteCookingSession();

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  const currentAudioRef = useRef<AudioBufferSourceNode | null>(null);
  const sessionRestoredRef = useRef(false);
  const initialMountRef = useRef(true);

  // Validate and sanitize a saved cooking session
  const validateCookingSession = (data: any): SavedCookingSession | null => {
    try {
      if (typeof data !== 'object' || data === null) return null;
      if (typeof data.recipeName !== 'string') return null;
      if (typeof data.recipeId !== 'string') return null;
      if (typeof data.currentStepIndex !== 'number') return null;
      if (typeof data.savedAt !== 'number') return null;
      
      return {
        recipeName: data.recipeName,
        recipeId: data.recipeId,
        currentStepIndex: Math.max(0, data.currentStepIndex),
        timer: typeof data.timer === 'number' ? Math.max(0, data.timer) : 0,
        isTimerRunning: typeof data.isTimerRunning === 'boolean' ? data.isTimerRunning : false,
        savedAt: data.savedAt
      };
    } catch {
      return null;
    }
  };

  // Restore cooking session on mount if recipe matches
  useEffect(() => {
    try {
      const saved = localStorage.getItem(COOKING_SESSION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const session = validateCookingSession(parsed);
        
        if (!session) {
          // Only clear if truly invalid (malformed data)
          localStorage.removeItem(COOKING_SESSION_STORAGE_KEY);
          return;
        }
        
        // Only restore if session is for the same recipe and less than 4 hours old
        const isRecent = Date.now() - session.savedAt < 4 * 60 * 60 * 1000;
        const isSameRecipe = session.recipeName === selectedMeal.recipeName && session.recipeId === selectedMeal.id;
        
        if (isRecent && isSameRecipe) {
          setCurrentStepIndex(session.currentStepIndex);
          setTimer(session.timer);
          setIsTimerRunning(session.isTimerRunning);
          sessionRestoredRef.current = true;
        } else if (!isRecent) {
          // Only clear if session is stale (expired), not if it's a different recipe
          // This preserves sessions for other recipes the user might return to
          localStorage.removeItem(COOKING_SESSION_STORAGE_KEY);
        }
        // If it's a different recipe but still recent, leave it intact
        // It will be overwritten when user starts cooking this new recipe
      }
    } catch (error) {
      console.error('Error loading saved cooking session:', error);
      localStorage.removeItem(COOKING_SESSION_STORAGE_KEY);
    }
  }, [selectedMeal.recipeName, selectedMeal.id]);

  // Save cooking session whenever state changes
  useEffect(() => {
    // Skip initial mount to prevent overwriting saved sessions for other recipes
    if (initialMountRef.current) {
      initialMountRef.current = false;
      // Also skip if we just restored a session
      if (sessionRestoredRef.current) {
        sessionRestoredRef.current = false;
      }
      return;
    }
    
    // Skip if we just restored a session (for subsequent renders)
    if (sessionRestoredRef.current) {
      sessionRestoredRef.current = false;
      return;
    }
    
    const session: SavedCookingSession = {
      recipeName: selectedMeal.recipeName,
      recipeId: selectedMeal.id,
      currentStepIndex,
      timer,
      isTimerRunning,
      savedAt: Date.now()
    };
    localStorage.setItem(COOKING_SESSION_STORAGE_KEY, JSON.stringify(session));
  }, [currentStepIndex, timer, isTimerRunning, selectedMeal.recipeName, selectedMeal.id]);

  // Clear cooking session when navigating back or completing
  const clearCookingSession = () => {
    localStorage.removeItem(COOKING_SESSION_STORAGE_KEY);
  };

  // Handle back to planning - clear session first
  const handleBackToPlanning = () => {
    clearCookingSession();
    onBackToPlanning();
  };

  // Load recipe steps when component mounts
  // Detect mobile device and setup early AudioContext preparation
  useEffect(() => {
    const detectMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent) ||
                      ('ontouchstart' in window) ||
                      (navigator.maxTouchPoints > 0);
      setIsMobileDevice(isMobile);
      console.log('📱 Mobile device detected:', isMobile);
      
      if (isMobile) {
        console.log('📱 Mobile device detected - AudioContext will be initialized on first user interaction');
      }
    };

    detectMobile();
  }, []);

  useEffect(() => {
    const loadRecipeSteps = async () => {
      setIsLoadingSteps(true);
      
      const steps = await withDemoErrorHandling(async () => {
        const response = await fetchCookingSteps(selectedMeal.recipeName);
        return response.steps?.map((step: any, index: number) => ({
          id: index + 1,
          instruction: step.instruction || '',
          duration: step.duration,
          tips: step.tips || '',
          visualCues: step.visualCues || '',
          commonMistakes: step.commonMistakes || '',
          safetyLevel: step.safetyLevel || 'minor'
        })) || [];
      }, 'cooking steps');
      
      if (steps && steps.length > 0) {
        setLoadedRecipeSteps(steps);
        // Reset audio state and set initial welcome message - but only once
        setAudioJustEnabled(false);
        setLastSpokenResponse(''); // Clear last spoken to allow new message
        
        // Only set welcome message if we don't already have one to prevent duplicates
        if (assistantResponse === 'Welcome! Let\'s start cooking your delicious meal together. I\'m here to guide you through each step.') {
          const welcomeMessage = `Great! I've prepared ${steps.length} steps for cooking ${selectedMeal.recipeName}. Are you ready to begin? Let's start with step 1: ${steps[0].instruction}`;
          setAssistantResponse(welcomeMessage);
        }
        
        // Note: cooking session will be started when component mounts
      } else {
        // Fallback to basic steps
        setLoadedRecipeSteps([
          {
            id: 1,
            instruction: `Prepare ingredients for ${selectedMeal.recipeName}`,
            tips: 'Gather all ingredients and prep workspace',
            visualCues: 'All ingredients should be within reach',
            commonMistakes: 'Not having everything ready before starting',
            safetyLevel: 'important'
          },
          {
            id: 2,
            instruction: `Begin cooking ${selectedMeal.recipeName}`,
            tips: 'Follow the recipe step by step',
            visualCues: 'Start with the base ingredients',
            commonMistakes: 'Rushing the cooking process',
            safetyLevel: 'important'
          }
        ]);
        setAudioJustEnabled(false);
        setLastSpokenResponse(''); // Clear last spoken to allow new message
        
        // Only set fallback message if we don't already have a custom welcome message
        if (assistantResponse === 'Welcome! Let\'s start cooking your delicious meal together. I\'m here to guide you through each step.') {
          const fallbackMessage = `I've prepared basic steps for ${selectedMeal.recipeName}. Let's start cooking together!`;
          setAssistantResponse(fallbackMessage);
        }
      }
      
      setIsLoadingSteps(false);
    };

    loadRecipeSteps();
    
    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      speechSynthesisRef.current = window.speechSynthesis;
    }
  }, [selectedMeal.recipeName]);

  // Cooking session management functions
  const startCookingSession = async (totalSteps: number, steps?: RecipeStep[]) => {
    try {
      const recipeSnapshot = {
        recipeName: selectedMeal.recipeName,
        description: selectedMeal.description,
        cookTime: selectedMeal.cookTime,
        difficulty: selectedMeal.difficulty,
        cuisine: selectedMeal.cuisine,
        pantryMatch: selectedMeal.pantryMatch,
        missingIngredients: selectedMeal.missingIngredients || [],
        isFusion: 'isFusion' in selectedMeal ? Boolean(selectedMeal.isFusion) : false,
        steps: (steps || []).map(s => ({
          id: s.id,
          instruction: s.instruction,
          duration: s.duration,
          tips: s.tips,
          visualCues: s.visualCues,
          commonMistakes: s.commonMistakes,
          safetyLevel: s.safetyLevel,
        })),
      };
      const sessionData = {
        recipeName: selectedMeal.recipeName,
        recipeDescription: selectedMeal.description,
        recipeSnapshot,
        ingredientsUsed: selectedMeal.missingIngredients || [],
        totalSteps,
      };
      
      const session = await startSessionMutation.mutateAsync(sessionData);
      setCookingSessionId(session.id);
      setCookingStartTime(new Date());
    } catch (error) {
      console.error('Failed to start cooking session:', error);
    }
  };

  const updateCookingProgress = async (completedSteps: number) => {
    if (cookingSessionId) {
      try {
        await updateSessionMutation.mutateAsync({
          sessionId: cookingSessionId,
          updateData: { completedSteps }
        });
      } catch (error) {
        console.error('Failed to update cooking progress:', error);
      }
    }
  };

  const completeCookingSession = async (rating?: number, notes?: string) => {
    // Clear saved cooking session on completion
    clearCookingSession();
    
    if (cookingSessionId && cookingStartTime) {
      try {
        const duration = Math.floor((Date.now() - cookingStartTime.getTime()) / 1000 / 60); // in minutes
        
        await completeSessionMutation.mutateAsync({
          sessionId: cookingSessionId,
          completionData: {
            ingredientsRemaining: [], // This could be enhanced to ask user for remaining ingredients
            userRating: rating || 5,
            userNotes: notes || '',
            cookingDuration: duration,
            completedSteps: loadedRecipeSteps.length,
          }
        });
        
        toast({
          title: "Cooking Session Complete!",
          description: `Great job cooking ${selectedMeal.recipeName}! Your pantry has been updated.`,
        });
      } catch (error) {
        console.error('Failed to complete cooking session:', error);
      }
    }
  };

  // Start cooking session when steps are loaded
  useEffect(() => {
    if (loadedRecipeSteps.length > 0 && !cookingSessionId) {
      startCookingSession(loadedRecipeSteps.length, loadedRecipeSteps);
    }
  }, [loadedRecipeSteps, cookingSessionId]);

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


  // Stop any current audio playback
  const stopAudio = () => {
    // Stop ElevenLabs audio
    if (currentAudioRef.current) {
      currentAudioRef.current.stop();
      currentAudioRef.current = null;
    }
    
    // Stop browser TTS
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
    
    setIsSpeaking(false);
  };

  // Initialize AudioContext with mobile support
  const initializeAudioContext = async () => {
    try {
      if (audioContextRef.current) {
        // Resume existing context if needed
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
          console.log('✅ AudioContext resumed from suspended state');
        }
      } else {
        // Create new AudioContext
        audioContextRef.current = new AudioContext();
        console.log(`✅ AudioContext created on ${isMobileDevice ? 'mobile' : 'desktop'} device`);
      }
      
      // Ensure context is running
      if (audioContextRef.current.state === 'running') {
        setAudioContextInitialized(true);
        // Note: Don't re-enable voice features here - only AudioContext is ready
        // Voice features will be re-enabled only when actual audio playback succeeds
        return true;
      }
      
      if (isMobileDevice) {
        console.log(`📱 Mobile AudioContext state: ${audioContextRef.current.state} - may need more user interaction`);
      }
      
      return false;
    } catch (error) {
      console.error(`❌ AudioContext initialization failed on ${isMobileDevice ? 'mobile' : 'desktop'}:`, error);
      return false;
    }
  };

  // Ensure AudioContext is ready for playback
  const ensureAudioContextReady = async () => {
    if (!audioContextRef.current || audioContextRef.current.state !== 'running') {
      const initialized = await initializeAudioContext();
      if (!initialized) {
        throw new Error('AudioContext not available');
      }
    }
    return audioContextRef.current;
  };

  // Check if message is operational (system message) and should not be spoken
  const isOperationalMessage = (text: string) => {
    const operationalPhrases = [
      'Processing your question',
      'Recording cancelled',
      'Recording stopped',
      'Please try asking again',
      'I couldn\'t access your microphone',
      'Recording timed out'
    ];
    return operationalPhrases.some(phrase => text.includes(phrase));
  };

  // Enhanced text-to-speech using ElevenLabs with proper AudioContext management
  const speakText = async (text: string, retryCount = 0) => {
    if (!isAudioEnabled || !text || isSpeaking || !voiceAvailable) return;
    
    // Prevent duplicate calls for the same text
    if (text === lastSpokenResponse && isSpeaking) return;
    
    // Don't speak operational/system messages
    if (isOperationalMessage(text)) {
      console.log('Skipping TTS for operational message:', text);
      return;
    }
    
    // Stop any current audio before starting new one
    stopAudio();
    
    setIsSpeaking(true);
    
    try {
      // Use ElevenLabs for high-quality voice
      console.log('🎵 Synthesizing speech:', text.substring(0, 50) + '...');
      const audioBuffer = await elevenLabsClient.synthesizeSpeech(text, voiceSettings);
      console.log('✅ Speech synthesis successful');
      
      // Ensure AudioContext is ready
      const audioContext = await ensureAudioContextReady();
      if (!audioContext) {
        throw new Error('AudioContext not available');
      }
      console.log('🔊 AudioContext state:', audioContext.state);
      
      const audioData = await audioContext.decodeAudioData(audioBuffer);
      const source = audioContext.createBufferSource();
      source.buffer = audioData;
      source.connect(audioContext.destination);
      
      currentAudioRef.current = source;
      
      source.onended = () => {
        console.log('✅ Audio playback completed');
        setIsSpeaking(false);
        currentAudioRef.current = null;
      };
      
      // Note: AudioBufferSourceNode doesn't have onerror event
      // Errors are handled by the try-catch block
      
      source.start();
      console.log('🎵 Audio playback started');
      
      // Only re-enable voice features if playback actually works
      if (!voiceAvailable) {
        setVoiceAvailable(true);
        console.log('🔊 Voice features re-enabled - audio playback confirmed working');
      }
      
    } catch (error) {
      console.error('❌ Speech synthesis/playback error:', error);
      setIsSpeaking(false);
      
      // Retry logic for mobile AudioContext issues
      if (retryCount < 2 && (error as Error).message.includes('AudioContext')) {
        console.log(`🔄 Retrying audio playback (attempt ${retryCount + 1})`);
        // Reset AudioContext and try again
        audioContextRef.current = null;
        setAudioContextInitialized(false);
        setTimeout(() => speakText(text, retryCount + 1), 100);
        return;
      }
      
      // Mark voice as unavailable and show notification
      setVoiceAvailable(false);
      
      // Show user notification only once per session
      if (!voiceErrorShown) {
        setVoiceErrorShown(true);
        const isAudioContextError = (error as Error).message.includes('AudioContext') || 
                                   (error as Error).message.includes('suspended') ||
                                   (error as Error).message.includes('not available');
        
        let title = "Voice features unavailable";
        let description = "Voice features aren't available at the moment. You may still continue your cooking session.";
        
        if (isMobileDevice && isAudioContextError) {
          title = "Mobile audio needs permission";
          description = "Tap the audio button or 'Ask for Help' to enable voice features. You can continue cooking with text instructions.";
        } else if (isMobileDevice) {
          description = "Voice features may need browser permission. You can continue cooking with text instructions.";
        }
        
        toast({
          title,
          description,
          variant: "destructive",
          duration: 6000
        });
      }
    }
  };

  // Toggle transcription pinned state and persist to localStorage
  const toggleTranscriptionPinned = () => {
    setIsTranscriptionPinned((prev: boolean) => {
      const newValue = !prev;
      localStorage.setItem('laica_transcription_pinned', JSON.stringify(newValue));
      return newValue;
    });
  };

  // Handle swipe gestures for transcription box
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchEndY - touchStartY.current;
    const swipeThreshold = 50; // pixels

    if (Math.abs(deltaY) > swipeThreshold) {
      if (deltaY > 0 && isTranscriptionPinned) {
        // Swiped down - unpin (minimize)
        toggleTranscriptionPinned();
      } else if (deltaY < 0 && !isTranscriptionPinned) {
        // Swiped up - pin (expand)
        toggleTranscriptionPinned();
      }
    }
  };

  // Speak assistant response when it changes (only if audio is enabled and not recording)
  // Don't speak if audio was just turned back on (to avoid repeating current step)
  // Don't speak while voice recording to prevent contamination
  const [audioJustEnabled, setAudioJustEnabled] = useState(false);
  const [lastSpokenResponse, setLastSpokenResponse] = useState<string>('');
  const [speechTimeoutId, setSpeechTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  useEffect(() => {
    // Simple speech handling with basic duplicate prevention
    if (assistantResponse && isAudioEnabled && !audioJustEnabled && !isVoiceRecording && assistantResponse !== lastSpokenResponse) {
      // Clear any pending speech to prevent duplicates
      if (speechTimeoutId) {
        clearTimeout(speechTimeoutId);
      }
      
      // Shorter delay for better responsiveness, longer only during loading
      const delay = isLoadingSteps ? 1200 : 800;
      const timeoutId = setTimeout(() => {
        if (!isVoiceRecording && assistantResponse) { // Double-check we're still not recording
          speakText(assistantResponse);
          setLastSpokenResponse(assistantResponse);
        }
        setSpeechTimeoutId(null);
      }, delay);
      
      setSpeechTimeoutId(timeoutId);
    }
    if (audioJustEnabled) {
      setAudioJustEnabled(false);
    }
  }, [assistantResponse, isAudioEnabled, audioJustEnabled, lastSpokenResponse, isVoiceRecording, isLoadingSteps]);
  
  // Clean up speech timeout on unmount
  useEffect(() => {
    return () => {
      if (speechTimeoutId) {
        clearTimeout(speechTimeoutId);
      }
    };
  }, [speechTimeoutId]);

  // Track when audio is enabled to prevent immediate replay
  useEffect(() => {
    if (isAudioEnabled) {
      setAudioJustEnabled(true);
    }
  }, [isAudioEnabled]);

  const nextStep = () => {
    if (currentStepIndex < currentRecipeSteps.length - 1) {
      const newStepIndex = currentStepIndex + 1;
      setCurrentStepIndex(newStepIndex);
      const nextStepData = currentRecipeSteps[newStepIndex];
      setTimer(nextStepData?.duration || 0);
      setIsTimerRunning(false);
      
      // Reset the audioJustEnabled flag when moving to next step
      setAudioJustEnabled(false);
      setLastSpokenResponse(''); // Clear to allow new step message
      
      const stepText = `Step ${newStepIndex + 1}: ${nextStepData.instruction}. ${nextStepData.tips}`;
      setAssistantResponse(stepText);
      
      // Update cooking progress
      updateCookingProgress(newStepIndex + 1);
    } else {
      setAudioJustEnabled(false);
      setLastSpokenResponse(''); // Clear to allow completion message
      setAssistantResponse("Congratulations! You've completed all the cooking steps. Your meal should be ready to enjoy! How did it turn out?");
      
      // Complete cooking session with default rating
      completeCookingSession(5, "Cooking completed successfully");
    }
  };

  const previousStep = () => {
    if (currentStepIndex > 0) {
      const newStepIndex = currentStepIndex - 1;
      setCurrentStepIndex(newStepIndex);
      const prevStepData = currentRecipeSteps[newStepIndex];
      setTimer(prevStepData?.duration || 0);
      setIsTimerRunning(false);
      
      // Reset the audioJustEnabled flag when moving to previous step
      setAudioJustEnabled(false);
      setLastSpokenResponse(''); // Clear to allow previous step message
      
      const stepText = `Back to step ${newStepIndex + 1}: ${prevStepData.instruction}`;
      setAssistantResponse(stepText);
    }
  };

  const startTimer = (minutes: number) => {
    setTimer(minutes * 60);
    setIsTimerRunning(true);
    setAssistantResponse(`Timer set for ${minutes} minutes. I'll let you know when time is up!`);
  };

  // Clean up audio on component unmount or page navigation
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  const repeatStepInstructions = () => {
    if (!currentStep) return;
    
    // Reset audioJustEnabled to ensure repeat step plays even if audio was just unmuted
    setAudioJustEnabled(false);
    setLastSpokenResponse(''); // Clear to force repeat step to play
    const stepText = `Step ${currentStepIndex + 1}: ${currentStep.instruction}. ${currentStep.tips}`;
    setAssistantResponse(stepText);
  };

  // Voice recording functionality with silence detection
  const startVoiceRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setAssistantResponse("Voice recording is not supported in this browser. Please use a modern browser with microphone access.");
      return;
    }

    try {
      // IMMEDIATELY stop any playing audio to prevent conflicts
      stopAudio();
      
      // Ensure AudioContext is ready for recording
      await initializeAudioContext();
      
      setIsVoiceRecording(true);
      // Don't set any assistant response to avoid audio feedback during recording
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      // Set up audio context for silence detection
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);
      
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      let silenceStart = Date.now();
      let hasDetectedSound = false;
      let isCurrentlyListening = true;
      let initialDelayComplete = false;
      let recordingStartTime = Date.now();
      const SILENCE_THRESHOLD = 3; // Based on real audio levels of 0.5-0.7 observed
      const SILENCE_DURATION = 2000; // 2 seconds of silence
      const INITIAL_DELAY = 1500; // 1.5 second delay before starting silence detection
      const MAX_RECORDING_TIME = 15000; // Reduced to 15 seconds max recording
      const MIN_RECORDING_TIME = 2000; // 2 second minimum for valid recording
      const AUTO_STOP_TIME = 8000; // Auto-stop after 8 seconds if we detect any speech
      
      const checkAudioLevel = () => {
        if (!isCurrentlyListening) return;
        
        // Check if initial delay has passed
        const currentTime = Date.now();
        if (!initialDelayComplete) {
          if (currentTime - recordingStartTime < INITIAL_DELAY) {
            setTimeout(checkAudioLevel, 100);
            return;
          }
          initialDelayComplete = true;
          console.log('Initial delay complete, starting silence detection');
        }
        
        analyser.getByteTimeDomainData(dataArray);
        
        // Calculate volume using time domain data (more reliable for speech)
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          const sample = (dataArray[i] - 128) / 128; // Convert to -1 to 1 range
          sum += sample * sample;
        }
        const volume = Math.sqrt(sum / bufferLength) * 100;
        const recordingTime = Date.now() - recordingStartTime;
        
        console.log(`🎤 Audio level: ${volume.toFixed(2)} (threshold: ${SILENCE_THRESHOLD}), Recording time: ${(recordingTime/1000).toFixed(1)}s, Has detected sound: ${hasDetectedSound}, Initial delay complete: ${initialDelayComplete}`);
        
        // Extra debugging - track volume ranges
        if (initialDelayComplete) {
          if (volume > SILENCE_THRESHOLD) {
            console.log(`🔊 SOUND detected - Volume: ${volume.toFixed(2)} > ${SILENCE_THRESHOLD}`);
          } else {
            console.log(`🔇 QUIET detected - Volume: ${volume.toFixed(2)} <= ${SILENCE_THRESHOLD}`);
          }
        }
        
        // Check for maximum recording time limit
        if (recordingTime > MAX_RECORDING_TIME) {
          console.log('Auto-stopping due to maximum recording limit');
          isCurrentlyListening = false;
          if (hasDetectedSound && recordingTime > MIN_RECORDING_TIME) {
            stopVoiceRecording();
          } else {
            cancelVoiceRecording();
          }
          return;
        }
        
        // Auto-stop after reasonable time if we've detected speech (backup silence detection)
        if (hasDetectedSound && initialDelayComplete && recordingTime > AUTO_STOP_TIME) {
          console.log('🕒 Auto-stopping after 8 seconds with detected speech');
          isCurrentlyListening = false;
          stopVoiceRecording();
          return;
        }
        
        if (volume > SILENCE_THRESHOLD) {
          // Sound detected
          if (!hasDetectedSound) {
            hasDetectedSound = true;
            // Don't set any assistant response to avoid audio feedback during recording
          }
          silenceStart = Date.now();
        } else if (hasDetectedSound && initialDelayComplete) {
          // Silence detected after sound was heard and initial delay passed
          const silenceDuration = Date.now() - silenceStart;
          console.log(`🔇 SILENCE TRACKING - Duration: ${silenceDuration}ms / ${SILENCE_DURATION}ms needed, Volume: ${volume.toFixed(2)}`);
          
          if (silenceDuration >= SILENCE_DURATION) {
            console.log('Auto-processing due to silence detection');
            isCurrentlyListening = false;
            const totalRecordingTime = Date.now() - recordingStartTime;
            console.log(`Total recording time: ${totalRecordingTime}ms, minimum: ${MIN_RECORDING_TIME}ms`);
            
            if (totalRecordingTime >= MIN_RECORDING_TIME) {
              // Don't set assistant response to avoid audio feedback
              stopVoiceRecording();
            } else {
              console.log('Recording too short, cancelling');
              // Don't set assistant response to avoid audio feedback
              cancelVoiceRecording();
            }
            return;
          }
        }
        
        // Continue checking
        setTimeout(checkAudioLevel, 100); // Check every 100ms for better responsiveness
      };
      
      const chunks: BlobPart[] = [];
      mediaRecorderRef.current.ondataavailable = (event) => {
        chunks.push(event.data);
      };
      
      setShouldProcessRecording(true); // Reset processing flag
      
      mediaRecorderRef.current.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        audioContext.close();
        
        console.log('Recording stopped. shouldProcessRecording:', shouldProcessRecording, 'chunks.length:', chunks.length);
        
        // Check the shouldProcess flag at processing time - this prevents cancelled recordings from processing
        if (shouldProcessRecording && chunks.length > 0) {
          setIsProcessing(true);
          setAssistantResponse("Processing your question...");
          setLastSpokenResponse(''); // Clear to allow next real response
          
          const audioBlob = new Blob(chunks, { type: 'audio/wav' });
          await processVoiceQuestion(audioBlob);
        } else {
          console.log('Recording not processed - either cancelled or no audio data');
          setIsProcessing(false);
        }
      };
      
      mediaRecorderRef.current.start();
      // Store start time for initial delay
      (mediaRecorderRef.current as any).startTime = Date.now();
      
      // Start recording duration timer
      setRecordingDuration(0);
      const durationTimer = setInterval(() => {
        setRecordingDuration(prev => prev + 0.1);
      }, 100);
      setRecordingTimer(durationTimer);
      
      checkAudioLevel(); // Start silence detection
      
      // Auto-stop after 35 seconds as final safety fallback (5s buffer beyond max recording)
      const timeout = setTimeout(() => {
        console.log('Auto-stopping due to 35s safety timeout');
        isCurrentlyListening = false;
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          setAssistantResponse("Recording timed out. Please try asking your question again, keeping it under 30 seconds.");
          cancelVoiceRecording();
        }
      }, 35000);
      setVoiceProcessingTimeout(timeout);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setAssistantResponse("I couldn't access your microphone. Please check your browser permissions and try again.");
      setIsVoiceRecording(false);
    }
  };

  const stopVoiceRecording = () => {
    console.log('Stopping voice recording');
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (voiceProcessingTimeout) {
      clearTimeout(voiceProcessingTimeout);
      setVoiceProcessingTimeout(null);
    }
    if (silenceTimeout) {
      clearTimeout(silenceTimeout);
      setSilenceTimeout(null);
    }
    if (recordingTimer) {
      clearInterval(recordingTimer);
      setRecordingTimer(null);
    }
    setIsVoiceRecording(false);
  };

  const cancelVoiceRecording = () => {
    console.log('Cancelling voice recording - will NOT process');
    
    // Cancel without processing - set flag BEFORE stopping recorder
    setShouldProcessRecording(false);
    
    // Stop all recording processes
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (voiceProcessingTimeout) {
      clearTimeout(voiceProcessingTimeout);
      setVoiceProcessingTimeout(null);
    }
    if (silenceTimeout) {
      clearTimeout(silenceTimeout);
      setSilenceTimeout(null);
    }
    if (recordingTimer) {
      clearInterval(recordingTimer);
      setRecordingTimer(null);
    }
    
    // Reset all states
    setIsVoiceRecording(false);
    setIsProcessing(false);
    setRecordingDuration(0);
    
    // Clear any pending responses - no explicit message needed for natural conversation flow
    setLastSpokenResponse('');
  };

  const processVoiceQuestion = async (audioBlob: Blob) => {
    try {
      // Check usage limits before processing
      const usageLimits = UsageTracker.checkUsageLimits();
      
      if (!usageLimits.withinLimits) {
        const exceeded = usageLimits.limitsExceeded.join(', ');
        setAssistantResponse(`Voice questions are temporarily limited. You've reached your ${exceeded} limit. Remaining usage: ${usageLimits.remainingUsage.dailyMinutes.toFixed(1)} min today.`);
        setIsProcessing(false);
        return;
      }
      
      // Show warnings if approaching limits
      if (usageLimits.warnings.length > 0) {
        console.warn('Usage warnings:', usageLimits.warnings);
      }
      
      // Compress and optimize audio before sending for transcription
      console.log('Compressing audio for cost optimization...');
      const audioProcessingResult = await AudioProcessor.compressAudio(audioBlob);
      
      console.log('Audio compression results:', {
        originalSize: audioProcessingResult.originalSize,
        compressedSize: audioProcessingResult.compressedSize,
        compressionRatio: audioProcessingResult.compressionRatio.toFixed(2),
        duration: audioProcessingResult.duration.toFixed(2) + 's'
      });
      
      // Use compressed audio for transcription
      const formData = new FormData();
      formData.append('audio', audioProcessingResult.blob, 'recording.wav');
      
      console.log('Sending optimized audio for transcription...');
      const transcriptionResponse = await fetch('/api/speech/transcribe', {
        method: 'POST',
        body: formData,
      });
      
      if (!transcriptionResponse.ok) {
        throw new Error(`Transcription failed: ${transcriptionResponse.statusText}`);
      }
      
      const { transcription, success } = await transcriptionResponse.json();
      
      if (!success || !transcription?.trim()) {
        throw new Error('No transcription received');
      }
      
      console.log('Transcription received:', transcription);
      
      // Record usage for analytics and cost tracking
      const newUsageStats = UsageTracker.recordUsage(
        audioProcessingResult.duration, 
        audioProcessingResult.compressionRatio
      );
      
      // Update local state to reflect new usage
      setUsageStats(newUsageStats);
      
      console.log('Current usage stats:', {
        totalTranscriptions: newUsageStats.totalTranscriptions,
        dailyUsage: `${newUsageStats.dailyUsage.toFixed(2)} min`,
        totalCost: `$${newUsageStats.totalCost.toFixed(4)}`
      });
      
      // Create a detailed context for the AI about the current step and future steps
      const futureSteps = currentRecipeSteps.slice(currentStepIndex + 1, currentStepIndex + 3);
      const futureStepsText = futureSteps.length > 0 
        ? `Upcoming steps: ${futureSteps.map((step, idx) => `${idx + currentStepIndex + 2}. ${step.instruction}`).join(' ')}`
        : '';
      
      const contextualPrompt = `Current cooking step: "${currentStep?.instruction}" 
      Tips for this step: "${currentStep?.tips}"
      Visual cues: "${currentStep?.visualCues}"
      Common mistakes: "${currentStep?.commonMistakes}"
      ${futureStepsText}
      
      User question (via voice): "${transcription}"
      
      Please provide a helpful, contextual answer that relates specifically to this step and mentions how this connects to future steps when relevant. Keep the response conversational and encouraging.`;
      
      const response = await withDemoErrorHandling(async () => {
        return await fetchCookingAssistance(contextualPrompt, transcription);
      }, 'cooking assistance');
      
      if (response) {
        setLastSpokenResponse(''); // Clear to allow new response
        setAssistantResponse(response || "I'm here to help! Can you tell me more about what you're having trouble with?");
      } else {
        setLastSpokenResponse(''); // Clear to allow new response
        setAssistantResponse("I'm having trouble connecting right now, but let me give you a general tip: take your time with this step and follow the visual cues I mentioned.");
      }
      
    } catch (error) {
      console.error('Error processing voice question:', error);
      setLastSpokenResponse(''); // Clear to allow new response
      setAssistantResponse("I didn't catch that. Could you try again?");
    }
    
    setIsProcessing(false);
  };

  const askForHelp = async () => {
    // Initialize AudioContext on user interaction (required for mobile)
    await initializeAudioContext();
    
    if (isVoiceRecording) {
      cancelVoiceRecording();
    } else {
      startVoiceRecording();
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
          <p className="text-gray-600">Setting up personalized step-by-step instructions for {selectedMeal.recipeName}...</p>
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
          onClick={handleBackToPlanning}
          className="text-white hover:bg-white/20"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Planning
        </Button>
        
        <div className="text-center">
          <h1 className="text-xl font-bold">{selectedMeal.recipeName}</h1>
          <p className="text-sm text-gray-300">Live Cooking Assistant</p>
        </div>

        {/* Spacer to balance the header layout */}
        <div className="w-[40px]"></div>
      </div>

      {/* Main Content Area - Centered Step Information */}
      <div className="flex justify-center mb-4">
        <div className="w-full max-w-md space-y-4">
          {/* Processing Overlay - moved to be overlay on step panel when needed */}
          {(isProcessing || isAnalyzing) && (
            <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50">
              <div className="text-center text-white bg-black/90 px-8 py-6 rounded-lg border border-gray-600">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <p className="text-sm">
                  {isProcessing ? 'Processing your question...' : 'Analyzing cooking progress...'}
                </p>
              </div>
            </div>
          )}
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
          <div className="flex justify-between gap-2 mb-4">
            <Button
              onClick={previousStep}
              disabled={currentStepIndex === 0}
              className="flex-1 bg-gray-600 hover:bg-gray-500 text-white"
            >
              <SkipBack className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              onClick={nextStep}
              disabled={currentStepIndex >= currentRecipeSteps.length - 1}
              className="flex-1 bg-white hover:bg-gray-100 text-black"
            >
              Next
              <SkipForward className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {/* Audio Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mb-4">
            {/* Repeat Step Button */}
            <Button
              onClick={repeatStepInstructions}
              className="w-full sm:flex-1 bg-yellow-500 hover:bg-yellow-400 text-black"
            >
              <Repeat className="h-4 w-4 mr-2" />
              Repeat Step
            </Button>

            {/* Voice Ask for Help Button */}
            <div className="w-full sm:flex-1">
              <Button
                variant={isVoiceRecording ? "destructive" : "default"}
                onClick={askForHelp}
                disabled={isProcessing && !isVoiceRecording}
                className="w-full"
              >
                {isProcessing && !isVoiceRecording ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Processing...
                  </>
                ) : isVoiceRecording ? (
                  <>
                    <MicOff className="h-4 w-4 mr-2" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 mr-2" />
                    Ask for Help
                  </>
                )}
              </Button>
              
              {/* Recording Indicator - Visual only */}
              {isVoiceRecording && (
                <div className="mt-2 text-center">
                  <div className="text-sm text-white bg-red-600 px-2 py-1 rounded-full inline-flex items-center gap-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    Listening...
                  </div>
                </div>
              )}
            </div>

            {/* Large Mute/Unmute Button */}
            <Button
              onClick={async () => {
                if (!voiceAvailable) return; // Don't allow interaction when voice is unavailable
                
                // Initialize AudioContext on user interaction (required for mobile)
                await initializeAudioContext();
                
                if (isAudioEnabled) {
                  // When muting, stop any current audio
                  stopAudio();
                }
                setIsAudioEnabled(!isAudioEnabled);
              }}
              disabled={!voiceAvailable}
              className={`w-full sm:w-auto px-6 py-3 font-medium ${
                !voiceAvailable
                  ? 'bg-gray-400 text-gray-200 border-gray-400 cursor-not-allowed'
                  : isAudioEnabled 
                  ? 'bg-green-600 hover:bg-green-700 text-white border-green-600' 
                  : 'bg-red-600 hover:bg-red-700 text-white border-red-600'
              }`}
              size="lg"
            >
              {!voiceAvailable ? (
                <>
                  <VolumeX className="h-4 w-4 mr-2" />
                  Voice mode unavailable
                </>
              ) : isAudioEnabled ? (
                <>
                  <Volume2 className="h-4 w-4 mr-2" />
                  Audio On
                </>
              ) : (
                <>
                  <VolumeX className="h-4 w-4 mr-2" />
                  Muted
                </>
              )}
            </Button>
          </div>

          {/* Closed Captioning with Pin/Unpin functionality */}
          <div 
            ref={transcriptionRef}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className={`rounded-lg transition-all duration-300 ease-in-out relative bg-gray-900 p-4 ${
              isTranscriptionPinned ? 'sticky bottom-4' : ''
            }`}
            data-testid="transcription-box"
          >
            {/* Pin toggle button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleTranscriptionPinned();
              }}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
              aria-label={isTranscriptionPinned ? "Unpin transcription" : "Pin transcription"}
              data-testid="button-toggle-pin"
            >
              {isTranscriptionPinned ? (
                <Pin className="h-4 w-4 text-white" />
              ) : (
                <PinOff className="h-4 w-4 text-white" />
              )}
            </button>

            {/* Always show full expanded text regardless of pin state */}
            <div className="text-center pr-10">
              <p 
                className="text-white leading-relaxed"
                style={{ fontSize: `${captionSize}px` }}
                data-testid="text-transcription-full"
              >
                {assistantResponse}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}