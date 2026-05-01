import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useResetPantry, useUpdateUserProfile } from '@/hooks/useAuth';
import { useDeleteCookingSession, useDeleteAllCookingSessions } from '@/hooks/useCookingSession';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { NativeCamera } from '@/components/ui/native-camera';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { Camera, Trash2, Plus, Settings, ChefHat, Package, Bell, User, Upload, Clock, MoreVertical, History, Check, Leaf, Sparkles, Utensils } from 'lucide-react';
import { mergeUniqueEntries, mergeUniqueEntriesWithMetadata, normalizeEntryLabel, parseCommaSeparatedEntries } from '@/lib/entryParsing';
import { analyzeImage } from '@/lib/openai';
import {
  extractVisionLabels,
  getVisionRejectionFeedback,
  isRejectedVisionResult,
  type VisionAnalysisResult,
  type VisionScanType,
} from '@/lib/visionResult';
import type { CookingSession } from '@shared/schema';
import type { RecipeSnapshotData } from '@/hooks/useCookingSession';

interface UserProfile {
  cookingSkill: string;
  dietaryRestrictions: string[];
  pantryIngredients: string[];
  kitchenEquipment: string[];
  favoriteChefs: string[];
}

interface UserSettingsProps {
  userProfile: UserProfile;
  onProfileUpdate: (profile: UserProfile) => void;
  onBackToPlanning: () => void;
}

function HistoryTab() {
  const { toast } = useToast();
  const { data: sessions, isLoading } = useQuery<CookingSession[]>({
    queryKey: ['/api/cooking/sessions'],
  });
  const deleteSessionMutation = useDeleteCookingSession();
  const deleteAllMutation = useDeleteAllCookingSessions();

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [hiddenIds, setHiddenIds] = useState<Set<number>>(new Set());
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const deleteTimersRef = useRef<Map<number, NodeJS.Timeout>>(new Map());
  const deleteAllTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleDelete = useCallback((sessionId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (expandedId === sessionId) setExpandedId(null);

    const existingTimer = deleteTimersRef.current.get(sessionId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      deleteTimersRef.current.delete(sessionId);
    }

    setHiddenIds(prev => new Set(prev).add(sessionId));

    const timer = setTimeout(() => {
      deleteTimersRef.current.delete(sessionId);
      deleteSessionMutation.mutate(sessionId, {
        onError: () => {
          setHiddenIds(prev => {
            const next = new Set(prev);
            next.delete(sessionId);
            return next;
          });
          toast({ title: "Failed to delete", variant: "destructive" });
        },
      });
    }, 5000);
    deleteTimersRef.current.set(sessionId, timer);

    toast({
      title: "Recipe removed",
      duration: 5000,
      action: (
        <ToastAction
          altText="Undo delete"
          onClick={() => {
            const t = deleteTimersRef.current.get(sessionId);
            if (t) {
              clearTimeout(t);
              deleteTimersRef.current.delete(sessionId);
            }
            setHiddenIds(prev => {
              const next = new Set(prev);
              next.delete(sessionId);
              return next;
            });
          }}
        >
          Undo
        </ToastAction>
      ),
    });
  }, [expandedId, deleteSessionMutation, toast]);

  const handleDeleteAll = () => {
    setShowDeleteAllDialog(false);

    if (deleteAllTimerRef.current) {
      clearTimeout(deleteAllTimerRef.current);
      deleteAllTimerRef.current = null;
    }

    const allIds = sessions?.map(s => s.id) || [];
    setHiddenIds(prev => {
      const next = new Set(prev);
      allIds.forEach(id => next.add(id));
      return next;
    });
    setExpandedId(null);

    const timer = setTimeout(() => {
      deleteAllTimerRef.current = null;
      deleteAllMutation.mutate(undefined, {
        onError: () => {
          setHiddenIds(prev => {
            const next = new Set(prev);
            allIds.forEach(id => next.delete(id));
            return next;
          });
          toast({ title: "Failed to delete history", variant: "destructive" });
        },
      });
    }, 5000);
    deleteAllTimerRef.current = timer;

    toast({
      title: "All history removed",
      duration: 5000,
      action: (
        <ToastAction
          altText="Undo delete all"
          onClick={() => {
            if (deleteAllTimerRef.current) {
              clearTimeout(deleteAllTimerRef.current);
              deleteAllTimerRef.current = null;
            }
            setHiddenIds(prev => {
              const next = new Set(prev);
              allIds.forEach(id => next.delete(id));
              return next;
            });
          }}
        >
          Undo
        </ToastAction>
      ),
    });
  };

  const formatDate = (dateStr: string | Date | null) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) +
      ' at ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  const visibleSessions = sessions?.filter(s => !hiddenIds.has(s.id)) || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <CardTitle className="text-lg">Cooking History</CardTitle>
        {visibleSessions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={() => setShowDeleteAllDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete All History
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {visibleSessions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <History className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No cooking history yet.</p>
            <p className="text-sm text-gray-400 mt-1">Your past recipes will appear here after you start cooking.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {visibleSessions.map((session) => {
            const snapshot = session.recipeSnapshot as RecipeSnapshotData | null;
            const isExpanded = expandedId === session.id;
            const missingIngredients = snapshot?.missingIngredients ?? [];
            const recipeIngredients = snapshot?.ingredients ?? [];
            const recipeSteps = snapshot?.steps ?? [];
            return (
              <Card
                key={session.id}
                className="cursor-pointer transition-all hover:shadow-md"
                onClick={() => setExpandedId(isExpanded ? null : session.id)}
              >
                <CardContent className="p-4">
                  <div className={isExpanded ? 'sticky top-0 bg-white z-10 pb-3 border-b mb-3' : ''}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg">{session.recipeName}</h3>
                        <p className="text-xs text-gray-400 mt-1">{formatDate(session.startedAt)}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-red-500 shrink-0 ml-2"
                        onClick={(e) => handleDelete(session.id, e)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {(snapshot?.description || session.recipeDescription) && (
                      <p className="text-gray-600 text-sm mt-2">{snapshot?.description || session.recipeDescription}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-2 flex-wrap">
                      {snapshot?.cookTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {snapshot.cookTime} min
                        </span>
                      )}
                      {snapshot?.difficulty && <span>{snapshot.difficulty}</span>}
                      {snapshot?.cuisine && snapshot.cuisine !== 'International' && (
                        <span>{snapshot.cuisine}</span>
                      )}
                      {snapshot?.isFusion && (
                        <Badge className="bg-[#FFB347] text-white text-xs px-2 py-1">
                          Fusion
                        </Badge>
                      )}
                    </div>
                    {missingIngredients.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500">Extra ingredients needed:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {missingIngredients.map((ingredient: string) => (
                            <Badge key={ingredient} variant="outline" className="text-xs">
                              {ingredient}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="space-y-4 mt-3">
                      {recipeIngredients.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm mb-2">Ingredients</h4>
                          <div className="space-y-1">
                            {recipeIngredients.map((ing: RecipeSnapshotData['ingredients'][number], idx: number) => (
                              <div key={idx} className="flex items-center gap-2 text-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B6B] flex-shrink-0" />
                                <span>{ing.quantity ? `${ing.quantity} ` : ''}{ing.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {recipeSteps.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm mb-2">Recipe Steps</h4>
                          <ol className="space-y-3">
                            {recipeSteps.map((step: RecipeSnapshotData['steps'][number], idx: number) => (
                              <li key={idx} className="flex gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#FF6B6B] text-white text-xs flex items-center justify-center font-medium">
                                  {idx + 1}
                                </span>
                                <div className="flex-1">
                                  <p className="text-sm">{step.instruction}</p>
                                  {step.tips && (
                                    <p className="text-xs text-gray-400 mt-1">Tip: {step.tips}</p>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                      {recipeSteps.length === 0 && recipeIngredients.length === 0 && (
                        <p className="text-sm text-gray-400 text-center py-2">No detailed recipe data available for this session.</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all cooking history?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove all {visibleSessions.length} cooking session{visibleSessions.length !== 1 ? 's' : ''} from your history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAll}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function UserSettings({ userProfile, onProfileUpdate, onBackToPlanning }: UserSettingsProps) {
  const [profile, setProfile] = useState<UserProfile>(userProfile);
  
  // Sync local state with prop changes (e.g., after profile reset)
  useEffect(() => {
    setProfile(userProfile);
  }, [userProfile]);
  
  // Option arrays matching the initial profiling
  const skillLevels = [
    { value: 'beginner', label: 'Beginner', description: 'I can make basic dishes', icon: ChefHat },
    { value: 'intermediate', label: 'Intermediate', description: 'I follow recipes easily', icon: Utensils },
    { value: 'expert', label: 'Expert', description: 'I riff and modify dishes', icon: Sparkles }
  ];

  const dietaryOptions = [
    'No restrictions', 'Gluten Free', 'Vegetarian', 'Vegan', 'Dairy Free',
    'No Red Meat', 'Halal', 'Kosher', 'Keto', 'Paleo'
  ];

  const [showPantryCamera, setShowPantryCamera] = useState(false);
  const [showEquipmentCamera, setShowEquipmentCamera] = useState(false);
  const [isAnalyzingPantry, setIsAnalyzingPantry] = useState(false);
  const [isAnalyzingEquipment, setIsAnalyzingEquipment] = useState(false);
  const { toast } = useToast();

  // Handler functions matching the initial profiling
  const handleDietaryChange = (restriction: string) => {
    if (restriction === 'No restrictions') {
      setProfile(prev => ({ ...prev, dietaryRestrictions: ['No restrictions'] }));
    } else {
      setProfile(prev => ({
        ...prev,
        dietaryRestrictions: prev.dietaryRestrictions.includes('No restrictions')
          ? [restriction]
          : prev.dietaryRestrictions.includes(restriction)
          ? prev.dietaryRestrictions.filter(r => r !== restriction)
          : [...prev.dietaryRestrictions.filter(r => r !== 'No restrictions'), restriction]
      }));
    }
  };

  const resetPantryMutation = useResetPantry();
  const updateProfileMutation = useUpdateUserProfile();

  const handleResetPantry = async () => {
    if (window.confirm('Are you sure you want to completely reset your pantry? This will remove all current ingredients and cannot be undone.')) {
      try {
        await resetPantryMutation.mutateAsync();
        setProfile(prev => ({
          ...prev,
          pantryIngredients: []
        }));
        toast({
          title: "Pantry Reset",
          description: "Your pantry has been completely cleared. You can now rescan or add ingredients fresh.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to reset pantry. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleResetEquipment = async () => {
    if (window.confirm('Are you sure you want to reset your equipment list? This will remove all current equipment.')) {
      try {
        await updateProfileMutation.mutateAsync({ 
          kitchenEquipment: [] 
        });
        setProfile(prev => ({
          ...prev,
          kitchenEquipment: []
        }));
        toast({
          title: "Equipment Reset",
          description: "Your equipment list has been cleared.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to reset equipment. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSavePantry = async () => {
    try {
      // Save only pantry ingredients without navigating away
      await updateProfileMutation.mutateAsync({ 
        pantryIngredients: profile.pantryIngredients 
      });
      toast({
        title: "Pantry saved!",
        description: "Your pantry ingredients have been updated successfully."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save pantry. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSaveEquipment = async () => {
    try {
      // Save only kitchen equipment without navigating away
      await updateProfileMutation.mutateAsync({ 
        kitchenEquipment: profile.kitchenEquipment 
      });
      toast({
        title: "Equipment saved!",
        description: "Your kitchen equipment has been updated successfully."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save equipment. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSaveProfile = async () => {
    try {
      // Save only profile settings without navigating away
      await updateProfileMutation.mutateAsync({ 
        cookingSkill: profile.cookingSkill,
        dietaryRestrictions: profile.dietaryRestrictions
      });
      toast({
        title: "Profile saved!",
        description: "Your cooking profile has been updated successfully."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handlePantryImageCapture = async (imageData: string) => {
    await handlePantryImageAnalysis(imageData);
  };

  const handleEquipmentImageCapture = async (imageData: string) => {
    await handleEquipmentImageAnalysis(imageData);
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }
      
      const img = new Image();
      
      img.onload = () => {
        try {
          const maxWidth = 1024;
          const maxHeight = 1024;
          let { width, height } = img;
          
          // Calculate new dimensions while maintaining aspect ratio
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
          resolve(compressedBase64);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const showRejectedScanFeedback = (type: VisionScanType, result: VisionAnalysisResult) => {
    const feedback = getVisionRejectionFeedback(result, type);
    toast({
      ...feedback,
      variant: "destructive",
    });
  };

  const showAlreadySavedFeedback = (type: VisionScanType) => {
    toast({
      title: "Already saved",
      description: `No new ${type === 'pantry' ? 'pantry items' : 'kitchen tools'} were added from that scan.`,
    });
  };

  const duplicateSkipCopy = (duplicateCount: number) =>
    duplicateCount > 0
      ? ` ${duplicateCount} already-saved item${duplicateCount === 1 ? ' was' : 's were'} skipped.`
      : '';

  const handlePantryImageAnalysis = async (imageData: string) => {
    setIsAnalyzingPantry(true);
    try {
      // Detect if image is HEIC format
      const isHEIC = imageData.includes('data:image/heic') || imageData.includes('data:image/heif');
      
      const result = await analyzeImage(imageData, isHEIC, { scanType: 'pantry' }) as VisionAnalysisResult;
      console.log('Pantry image analysis result:', result);

      if (isRejectedVisionResult(result)) {
        showRejectedScanFeedback('pantry', result);
        return;
      }

      const detectedIngredients = extractVisionLabels(result, 'pantry');
      
      if (detectedIngredients.length > 0) {
        // Clean and remove duplicates
        const cleanIngredients = detectedIngredients
          .map(i => normalizeEntryLabel(String(i).toLowerCase()))
          .filter(i => i && i.length > 1);
        const mergeResult = mergeUniqueEntriesWithMetadata(profile.pantryIngredients, cleanIngredients);
        setProfile(prev => ({ ...prev, pantryIngredients: mergeResult.items }));

        if (mergeResult.added.length === 0) {
          showAlreadySavedFeedback('pantry');
          return;
        }
        
        toast({
          title: "Pantry scan complete",
          description: `Found ${mergeResult.added.length} new ingredient${mergeResult.added.length === 1 ? '' : 's'}: ${mergeResult.added.slice(0, 3).join(', ')}${mergeResult.added.length > 3 ? '...' : ''}${duplicateSkipCopy(mergeResult.duplicateCount)}`
        });
      } else {
        toast({
          title: "No ingredients detected",
          description: "Try taking a clearer photo or add items manually.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error analyzing pantry image:', error);
      toast({
        title: "Analysis failed",
        description: "Unable to analyze image. Please check your connection and try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzingPantry(false);
      setShowPantryCamera(false);
    }
  };

  const handleEquipmentImageAnalysis = async (imageData: string) => {
    setIsAnalyzingEquipment(true);
    try {
      // Detect if image is HEIC format
      const isHEIC = imageData.includes('data:image/heic') || imageData.includes('data:image/heif');
      
      const result = await analyzeImage(imageData, isHEIC, { scanType: 'kitchen' }) as VisionAnalysisResult;
      console.log('Equipment image analysis result:', result);

      if (isRejectedVisionResult(result)) {
        showRejectedScanFeedback('kitchen', result);
        return;
      }

      const detectedEquipment = extractVisionLabels(result, 'kitchen');
      
      if (detectedEquipment.length > 0) {
        // Clean and remove duplicates
        const cleanEquipment = detectedEquipment
          .map(e => normalizeEntryLabel(String(e).toLowerCase()))
          .filter(e => e && e.length > 1);
        const mergeResult = mergeUniqueEntriesWithMetadata(profile.kitchenEquipment, cleanEquipment);
        setProfile(prev => ({ ...prev, kitchenEquipment: mergeResult.items }));

        if (mergeResult.added.length === 0) {
          showAlreadySavedFeedback('kitchen');
          return;
        }
        
        toast({
          title: "Kitchen scan complete",
          description: `Found ${mergeResult.added.length} new item${mergeResult.added.length === 1 ? '' : 's'}: ${mergeResult.added.slice(0, 3).join(', ')}${mergeResult.added.length > 3 ? '...' : ''}${duplicateSkipCopy(mergeResult.duplicateCount)}`
        });
      } else {
        toast({
          title: "No equipment detected",
          description: "Try taking a clearer photo or add items manually.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error analyzing kitchen image:', error);
      toast({
        title: "Analysis failed",
        description: "Unable to analyze image. Please check your connection and try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzingEquipment(false);
      setShowEquipmentCamera(false);
    }
  };

  const handleMultipleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'pantry' | 'kitchen') => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const maxFiles = type === 'pantry' ? 8 : 6;
    const selectedFiles = Array.from(files);

    if (selectedFiles.length > maxFiles) {
      toast({
        title: "Too many photos",
        description: `${type === 'pantry' ? 'Pantry' : 'Kitchen'} scan accepts up to ${maxFiles} photos per batch. Select ${maxFiles} or fewer and try again.`,
        variant: "destructive"
      });
      event.target.value = '';
      return;
    }

    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const processedFiles = selectedFiles.filter(file => {
      const fileType = file.type.toLowerCase();
      const fileName = file.name.toLowerCase();
      const isHEIC = fileName.endsWith('.heic') || fileName.endsWith('.heif');
      return supportedTypes.includes(fileType) || isHEIC;
    });

    if (processedFiles.length === 0) {
      toast({
        title: "Unsupported file format",
        description: "Please upload JPEG, PNG, GIF, WebP, or HEIC image files.",
        variant: "destructive"
      });
      event.target.value = '';
      return;
    }

    if (processedFiles.length !== selectedFiles.length) {
      toast({
        title: "Some files skipped",
        description: `${type === 'pantry' ? 'Pantry' : 'Kitchen'} accepts up to ${maxFiles} photos per batch. Processing ${processedFiles.length} image(s).`
      });
    }

    // Set analyzing state
    if (type === 'pantry') {
      setIsAnalyzingPantry(true);
    } else {
      setIsAnalyzingEquipment(true);
    }

    // Collect all results first, then update state once
    let allNewIngredients: string[] = [];
    let allNewEquipment: string[] = [];
    let rejectedCount = 0;
    let lastRejectedResult: VisionAnalysisResult | null = null;

    try {
      // Process files sequentially to avoid overwhelming the API
      for (let i = 0; i < processedFiles.length; i++) {
        const file = processedFiles[i];
        const fileType = file.type.toLowerCase();
        const fileName = file.name.toLowerCase();
        const isHEIC = fileName.endsWith('.heic') || fileName.endsWith('.heif');

        try {
          let result: VisionAnalysisResult;
          if (isHEIC) {
            // Handle HEIC files
            const reader = new FileReader();
            result = await new Promise<VisionAnalysisResult>((resolve, reject) => {
              reader.onload = async (e) => {
                try {
                  const base64 = e.target?.result as string;
                  const base64Data = base64.split(',')[1];
                  const analysisResult = await analyzeImage(base64Data, true, { scanType: type });
                  resolve(analysisResult);
                } catch (error) {
                  reject(error);
                }
              };
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
          } else {
            // Handle regular image files
            const compressedBase64 = await compressImage(file);
            result = await analyzeImage(compressedBase64, false, { scanType: type }) as VisionAnalysisResult;
          }

          if (isRejectedVisionResult(result)) {
            rejectedCount += 1;
            lastRejectedResult = result;
            continue;
          }

          // Extract ingredients or equipment from this image
          if (type === 'pantry' && result) {
            const detectedIngredients = extractVisionLabels(result, 'pantry');
            
            if (detectedIngredients.length > 0) {
              const cleanIngredients = detectedIngredients
                .map(i => normalizeEntryLabel(String(i).toLowerCase()))
                .filter(i => i && i.length > 1);
              allNewIngredients = [...allNewIngredients, ...cleanIngredients];
              console.log('Added ingredients:', cleanIngredients);
            }
          } else if (type === 'kitchen' && result) {
            const detectedEquipment = extractVisionLabels(result, 'kitchen');
            
            if (detectedEquipment.length > 0) {
              const cleanEquipment = detectedEquipment
                .map(e => normalizeEntryLabel(String(e).toLowerCase()))
                .filter(e => e && e.length > 1);
              allNewEquipment = [...allNewEquipment, ...cleanEquipment];
              console.log('Added equipment:', cleanEquipment);
            }
          }
          
          // Small delay between processing images to avoid overwhelming the API
          if (i < processedFiles.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (error) {
          console.error(`Error processing image ${i + 1}:`, error);
          // Continue processing other images even if one fails
        }
      }

      // Update state once with all accumulated results
      if (type === 'pantry' && allNewIngredients.length > 0) {
        const mergeResult = mergeUniqueEntriesWithMetadata(profile.pantryIngredients, allNewIngredients);
        setProfile(prev => ({
          ...prev,
          pantryIngredients: mergeResult.items
        }));

        if (mergeResult.added.length === 0) {
          showAlreadySavedFeedback('pantry');
        } else {
          toast({
            title: `Scan complete!`,
            description: `Found ${mergeResult.added.length} new ingredient${mergeResult.added.length === 1 ? '' : 's'} across ${processedFiles.length} image(s).${duplicateSkipCopy(mergeResult.duplicateCount)}${
              rejectedCount > 0 ? ` ${rejectedCount} text-only photo${rejectedCount === 1 ? ' was' : 's were'} skipped.` : ''
            }`
          });
        }
      } else if (type === 'kitchen' && allNewEquipment.length > 0) {
        const mergeResult = mergeUniqueEntriesWithMetadata(profile.kitchenEquipment, allNewEquipment);
        setProfile(prev => ({
          ...prev,
          kitchenEquipment: mergeResult.items
        }));

        if (mergeResult.added.length === 0) {
          showAlreadySavedFeedback('kitchen');
        } else {
          toast({
            title: `Scan complete!`,
            description: `Found ${mergeResult.added.length} new equipment item${mergeResult.added.length === 1 ? '' : 's'} across ${processedFiles.length} image(s).${duplicateSkipCopy(mergeResult.duplicateCount)}${
              rejectedCount > 0 ? ` ${rejectedCount} text-only photo${rejectedCount === 1 ? ' was' : 's were'} skipped.` : ''
            }`
          });
        }
      } else if (rejectedCount > 0 && lastRejectedResult) {
        showRejectedScanFeedback(type, lastRejectedResult);
      } else {
        toast({
          title: "No items detected",
          description: "Try taking clearer photos or add items manually.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error processing multiple images:', error);
      toast({
        title: "Processing error",
        description: "Some images could not be processed. Please try again or use individual uploads.",
        variant: "destructive"
      });
    } finally {
      // Reset analyzing state
      if (type === 'pantry') {
        setIsAnalyzingPantry(false);
        setShowPantryCamera(false);
      } else {
        setIsAnalyzingEquipment(false);
        setShowEquipmentCamera(false);
      }
    }
    
    event.target.value = '';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Kitchen & Settings</h1>
        <p className="text-muted-foreground">Manage your kitchen setup and preferences</p>
      </div>

      <Tabs defaultValue="pantry" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pantry" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Pantry
          </TabsTrigger>
          <TabsTrigger value="equipment" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Equipment
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Pantry Tab - Matching onboarding Step 4 */}
        <TabsContent value="pantry" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>What ingredients do you have in your pantry?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() => setShowPantryCamera(true)}
                  className="flex items-center gap-2"
                  disabled={isAnalyzingPantry}
                >
                  <Camera className="h-4 w-4" />
                  Open Camera
                </Button>
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('pantry-upload')?.click()}
                  className="flex items-center gap-2"
                  disabled={isAnalyzingPantry}
                >
                  <Upload className="h-4 w-4" />
                  Upload Images
                </Button>
                <input
                  id="pantry-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleMultipleImageUpload(e, 'pantry')}
                  className="hidden"
                />
                {isAnalyzingPantry && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    Analyzing image...
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Upload images of your pantry, or add ingredients manually below
              </p>
              
              {/* Manual ingredient entry */}
              <div className="mt-4">
                <Label htmlFor="manual-ingredients">Add ingredients manually:</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="manual-ingredients"
                    placeholder="e.g., onions"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const input = document.getElementById('manual-ingredients') as HTMLInputElement;
                      if (input && input.value.trim()) {
                        const newIngredients = parseCommaSeparatedEntries(input.value);
                        setProfile(prev => ({
                          ...prev,
                          pantryIngredients: mergeUniqueEntries(prev.pantryIngredients, newIngredients)
                        }));
                        input.value = '';
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  You may enter "onions" or multiple ingredients separated by a comma (e.g. apples, oranges)
                </p>
              </div>
              
              {/* Show added ingredients */}
              {profile.pantryIngredients.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-600">Ingredients added:</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleResetPantry}
                      className="text-xs h-7 px-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                    >
                      Reset Pantry
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {profile.pantryIngredients.map((ingredient, index) => (
                      <span 
                        key={index} 
                        className="bg-secondary/10 text-secondary text-xs px-2 py-1 rounded-full flex items-center gap-1"
                      >
                        {ingredient}
                        <button
                          onClick={() => {
                            setProfile(prev => ({
                              ...prev,
                              pantryIngredients: prev.pantryIngredients.filter((_, i) => i !== index)
                            }));
                          }}
                          className="text-secondary/60 hover:text-secondary text-xs"
                          type="button"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Having trouble with accuracy? Use "Reset Pantry" to clear everything and start fresh.
                  </p>
                </div>
              )}

              {/* Action buttons at bottom */}
              <div className="flex gap-2 justify-end pt-4 mt-6 border-t">
                <Button variant="outline" onClick={onBackToPlanning}>
                  Back to Planning
                </Button>
                <Button onClick={handleSavePantry}>
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Equipment Tab - Matching onboarding Step 5 */}
        <TabsContent value="equipment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>What kitchen equipment do you have?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() => setShowEquipmentCamera(true)}
                  className="flex items-center gap-2"
                  disabled={isAnalyzingEquipment}
                >
                  <Camera className="h-4 w-4" />
                  Open Camera
                </Button>
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('equipment-upload')?.click()}
                  className="flex items-center gap-2"
                  disabled={isAnalyzingEquipment}
                >
                  <Upload className="h-4 w-4" />
                  Upload Images
                </Button>
                <input
                  id="equipment-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleMultipleImageUpload(e, 'kitchen')}
                  className="hidden"
                />
                {isAnalyzingEquipment && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    Analyzing image...
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Upload images of your kitchen, or add equipment manually below
              </p>
              
              {/* Manual equipment entry */}
              <div className="mt-4">
                <Label htmlFor="manual-equipment">Add equipment manually:</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="manual-equipment"
                    placeholder="e.g., stove"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const input = document.getElementById('manual-equipment') as HTMLInputElement;
                      if (input && input.value.trim()) {
                        const newEquipment = parseCommaSeparatedEntries(input.value);
                        setProfile(prev => ({
                          ...prev,
                          kitchenEquipment: mergeUniqueEntries(prev.kitchenEquipment, newEquipment)
                        }));
                        input.value = '';
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  You may enter "stove" or multiple equipment separated by a comma (e.g. oven, blender)
                </p>
              </div>
              
              {/* Show added equipment */}
              {profile.kitchenEquipment.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-600">Equipment added:</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleResetEquipment}
                      className="text-xs h-7 px-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                    >
                      Reset Equipment
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {profile.kitchenEquipment.map((equipment, index) => (
                      <span 
                        key={index} 
                        className="bg-secondary/10 text-secondary text-xs px-2 py-1 rounded-full flex items-center gap-1"
                      >
                        {equipment}
                        <button
                          onClick={() => {
                            setProfile(prev => ({
                              ...prev,
                              kitchenEquipment: prev.kitchenEquipment.filter((_, i) => i !== index)
                            }));
                          }}
                          className="text-secondary/60 hover:text-secondary text-xs"
                          type="button"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons at bottom */}
              <div className="flex gap-2 justify-end pt-4 mt-6 border-t">
                <Button variant="outline" onClick={onBackToPlanning}>
                  Back to Planning
                </Button>
                <Button onClick={handleSaveEquipment}>
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cooking Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Cooking Skill Level</Label>
                <div role="radiogroup" aria-label="Cooking skill level" className="mt-2 space-y-3">
                  {skillLevels.map((skill) => {
                    const Icon = skill.icon;
                    return (
                      <button
                        key={skill.value}
                        type="button"
                        role="radio"
                        aria-checked={profile.cookingSkill === skill.value}
                        onClick={() => setProfile(prev => ({ ...prev, cookingSkill: skill.value }))}
                        className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition ${
                          profile.cookingSkill === skill.value ? 'border-primary bg-primary/10' : 'border-border bg-card'
                        }`}
                      >
                        <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          profile.cookingSkill === skill.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}>
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="flex-1">
                          <span className="block font-semibold">{skill.label}</span>
                          <span className="text-sm text-muted-foreground">{skill.description}</span>
                        </span>
                        {profile.cookingSkill === skill.value && <Check className="h-5 w-5 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label>Dietary Restrictions</Label>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {dietaryOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={profile.dietaryRestrictions.includes(option)}
                      onClick={() => handleDietaryChange(option)}
                      className={`flex items-center gap-3 rounded-lg border p-3 text-left transition ${
                        profile.dietaryRestrictions.includes(option) ? 'border-primary bg-primary/10' : 'border-border bg-card'
                      }`}
                    >
                      <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                        profile.dietaryRestrictions.includes(option) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                        <Leaf className="h-4 w-4" />
                      </span>
                      <span className="flex-1 text-sm font-medium">{option}</span>
                      {profile.dietaryRestrictions.includes(option) && <Check className="h-4 w-4 text-primary" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action buttons at bottom */}
              <div className="flex gap-2 justify-end pt-4 mt-6 border-t">
                <Button variant="outline" onClick={onBackToPlanning}>
                  Back to Planning
                </Button>
                <Button onClick={handleSaveProfile}>
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <HistoryTab />
        </TabsContent>
      </Tabs>

      {/* Pantry Camera Dialog */}
      <Dialog open={showPantryCamera} onOpenChange={setShowPantryCamera}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scan Your Pantry</DialogTitle>
            <DialogDescription>
              Take a photo of your pantry and I'll identify the ingredients for you.
            </DialogDescription>
          </DialogHeader>
          
          <NativeCamera
            title="Take Photo"
            onImageCapture={handlePantryImageCapture}
            onError={(error) => {
              toast({
                title: "Camera Error",
                description: error,
                variant: "destructive"
              });
              setShowPantryCamera(false);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Equipment Camera Dialog */}
      <Dialog open={showEquipmentCamera} onOpenChange={setShowEquipmentCamera}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scan Your Kitchen</DialogTitle>
            <DialogDescription>
              Take a photo of your kitchen and I'll identify the equipment you have.
            </DialogDescription>
          </DialogHeader>
          
          <NativeCamera
            title="Take Photo"
            onImageCapture={handleEquipmentImageCapture}
            onError={(error) => {
              toast({
                title: "Camera Error",
                description: error,
                variant: "destructive"
              });
              setShowEquipmentCamera(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
