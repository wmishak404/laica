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
  initialSection?: SettingsSection;
}

export type SettingsSection = 'hub' | 'pantry' | 'kitchen' | 'profile';

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

export default function UserSettings({ userProfile, onProfileUpdate: _onProfileUpdate, onBackToPlanning, initialSection = 'hub' }: UserSettingsProps) {
  const [profile, setProfile] = useState<UserProfile>(userProfile);
  const [activeSection, setActiveSection] = useState<SettingsSection>(initialSection);
  
  // Sync local state with prop changes (e.g., after profile reset)
  useEffect(() => {
    setProfile(userProfile);
  }, [userProfile]);

  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);
  
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

  const handleManualEntry = (type: 'pantry' | 'kitchen') => {
    const inputId = type === 'pantry' ? 'manual-ingredients' : 'manual-equipment';
    const input = document.getElementById(inputId) as HTMLInputElement | null;
    if (!input || !input.value.trim()) return;

    const newEntries = parseCommaSeparatedEntries(input.value);
    if (type === 'pantry') {
      setProfile(prev => ({
        ...prev,
        pantryIngredients: mergeUniqueEntries(prev.pantryIngredients, newEntries)
      }));
    } else {
      setProfile(prev => ({
        ...prev,
        kitchenEquipment: mergeUniqueEntries(prev.kitchenEquipment, newEntries)
      }));
    }
    input.value = '';
  };

  const sectionCards = [
    {
      id: 'pantry' as const,
      title: 'Pantry',
      description: `${profile.pantryIngredients.length} item${profile.pantryIngredients.length === 1 ? '' : 's'} saved`,
      icon: Package,
      tone: 'pantry',
    },
    {
      id: 'kitchen' as const,
      title: 'Kitchen',
      description: `${profile.kitchenEquipment.length} tool${profile.kitchenEquipment.length === 1 ? '' : 's'} saved`,
      icon: Settings,
      tone: 'kitchen',
    },
    {
      id: 'profile' as const,
      title: 'Cooking Profile',
      description: profile.cookingSkill ? `${profile.cookingSkill} skill and dietary notes` : 'Skill and dietary notes',
      icon: User,
      tone: 'profile',
    },
  ];

  const renderSectionNav = () => (
    <div className="returning-section-nav" aria-label="Settings sections">
      {sectionCards.map((section) => {
        const Icon = section.icon;
        return (
          <button
            key={section.id}
            type="button"
            className="returning-nav-pill"
            data-active={activeSection === section.id}
            onClick={() => setActiveSection(section.id)}
          >
            <Icon className="h-4 w-4" />
            <span>{section.title}</span>
          </button>
        );
      })}
    </div>
  );

  const renderHub = () => (
    <div className="space-y-4">
      <div className="returning-hero">
        <p className="returning-kicker">Settings</p>
        <h1 className="returning-display text-[2.45rem] font-extrabold leading-none">Keep Laica matched to your kitchen.</h1>
        <p className="returning-copy mt-3 max-w-sm text-sm leading-relaxed">
          Update the pantry, tools, and cooking profile Laica uses for Planning and Slop Bowl.
        </p>
      </div>

      <div className="space-y-3">
        {sectionCards.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              type="button"
              className="returning-hub-card"
              data-tone={section.tone}
              onClick={() => setActiveSection(section.id)}
            >
              <span className="returning-hub-icon" data-tone={section.tone}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1 text-left">
                <span className="block font-extrabold text-[hsl(var(--returning-ink))]">{section.title}</span>
                <span className="returning-copy block text-sm">{section.description}</span>
              </span>
              <span className="text-xl font-black text-primary">›</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderInventorySection = (type: 'pantry' | 'kitchen') => {
    const isPantry = type === 'pantry';
    const items = isPantry ? profile.pantryIngredients : profile.kitchenEquipment;
    const isAnalyzing = isPantry ? isAnalyzingPantry : isAnalyzingEquipment;
    const uploadId = isPantry ? 'pantry-upload' : 'equipment-upload';
    const manualId = isPantry ? 'manual-ingredients' : 'manual-equipment';
    const title = isPantry ? 'Pantry' : 'Kitchen';
    const description = isPantry
      ? 'Update what Laica can cook with.'
      : 'Update tools, pans, heat, and appliances.';
    const placeholder = isPantry ? 'rice, eggs, spinach' : 'oven, blender, sheet pan';
    const handleSave = isPantry ? handleSavePantry : handleSaveEquipment;
    const handleReset = isPantry ? handleResetPantry : handleResetEquipment;
    const setCameraOpen = isPantry ? setShowPantryCamera : setShowEquipmentCamera;

    return (
      <div className={`space-y-4 ${isPantry ? '' : 'returning-kitchen-tone'}`}>
        {renderSectionNav()}
        <section className="returning-panel">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="returning-kicker">{isPantry ? 'Returning setup' : 'Equipment setup'}</p>
              <h1 className="returning-display text-[2.25rem] font-extrabold leading-none">{title}</h1>
              <p className="returning-copy mt-2 text-sm leading-relaxed">{description}</p>
            </div>
            <span className="returning-count">{items.length}</span>
          </div>

          <div className="returning-scan-object mt-5" data-tone={isPantry ? 'pantry' : 'kitchen'}>
            <div className="returning-scan-frame">
              <Camera className="h-8 w-8 text-white/85" />
              <span className="returning-focus-ring" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                className="returning-action-button h-14 justify-start"
                variant="outline"
                onClick={() => setCameraOpen(true)}
                disabled={isAnalyzing}
              >
                <Camera className="mr-2 h-4 w-4" />
                Scan
              </Button>
              <Button
                type="button"
                className="returning-action-button h-14 justify-start"
                variant="outline"
                onClick={() => document.getElementById(uploadId)?.click()}
                disabled={isAnalyzing}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </Button>
            </div>
            <input
              id={uploadId}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleMultipleImageUpload(e, type)}
              className="hidden"
            />
            {isAnalyzing && (
              <div className="returning-status">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
                <span>{isPantry ? 'Scanning pantry photos...' : 'Scanning kitchen photos...'}</span>
              </div>
            )}
          </div>

          <div className="returning-manual mt-4">
            <Label htmlFor={manualId} className="text-sm font-extrabold text-[hsl(var(--returning-ink))]">
              {isPantry ? 'Add pantry items' : 'Add kitchen tools'}
            </Label>
            <div className="mt-2 flex gap-2">
              <Input
                id={manualId}
                placeholder={placeholder}
                className="h-12 rounded-2xl border-primary/20 bg-white/80 text-base font-bold"
              />
              <Button
                type="button"
                className={`h-12 rounded-2xl px-4 font-extrabold ${isPantry ? 'bg-primary hover:bg-primary/90' : 'returning-kitchen-save'}`}
                onClick={() => handleManualEntry(type)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {isPantry && <p className="returning-copy mt-2 px-1 text-xs">Separate pantry items with commas.</p>}
          </div>

          <div className="returning-list mt-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="font-extrabold text-[hsl(var(--returning-ink))]">{isPantry ? 'Saved pantry' : 'Saved tools'}</p>
                <p className="returning-copy text-xs">Remove anything Laica should ignore.</p>
              </div>
              {items.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="h-9 rounded-full border-destructive/20 px-3 text-xs font-extrabold text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Reset
                </Button>
              )}
            </div>

            {items.length === 0 ? (
              <div className="returning-empty">
                <Package className="h-8 w-8 text-primary/70" />
                <p>{isPantry ? 'No pantry items saved yet.' : 'No kitchen tools saved yet.'}</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {items.map((item, index) => (
                  <span key={`${item}-${index}`} className={`returning-chip ${isPantry ? '' : 'returning-chip-kitchen'}`}>
                    {item}
                    <button
                      type="button"
                      aria-label={`Remove ${item}`}
                      onClick={() => {
                        setProfile(prev => ({
                          ...prev,
                          [isPantry ? 'pantryIngredients' : 'kitchenEquipment']: items.filter((_, i) => i !== index)
                        }));
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="returning-actions">
            <Button variant="outline" className="returning-secondary-cta" onClick={() => setActiveSection('hub')}>
              Settings
            </Button>
            <Button className={`returning-primary-cta ${isPantry ? '' : 'returning-kitchen-save'}`} onClick={handleSave}>
              {isPantry ? 'Save pantry' : 'Save kitchen'}
            </Button>
          </div>
        </section>
      </div>
    );
  };

  const renderProfileSection = () => {
    const selectedDietary = new Set(profile.dietaryRestrictions);
    const remainingDietaryOptions = dietaryOptions.filter(option => option !== 'No restrictions');

    return (
      <div className="space-y-4">
        {renderSectionNav()}
        <section className="returning-panel">
          <p className="returning-kicker">Cooking Profile</p>
          <h1 className="returning-display text-[2.25rem] font-extrabold leading-none">How Laica adapts.</h1>
          <p className="returning-copy mt-2 text-sm leading-relaxed">
            Keep skill level and dietary notes current so suggestions stay useful.
          </p>

          <div className="mt-6 space-y-3">
            <Label className="text-sm font-extrabold text-[hsl(var(--returning-ink))]">Cooking skill</Label>
            <div role="radiogroup" aria-label="Cooking skill level" className="space-y-3">
              {skillLevels.map((skill) => {
                const Icon = skill.icon;
                const selected = profile.cookingSkill === skill.value;
                return (
                  <button
                    key={skill.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    data-selected={selected}
                    onClick={() => setProfile(prev => ({ ...prev, cookingSkill: skill.value }))}
                    className="returning-choice-row"
                  >
                    <span className="returning-choice-icon">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-extrabold text-[hsl(var(--returning-ink))]">{skill.label}</span>
                      <span className="returning-copy text-sm">{skill.description}</span>
                    </span>
                    {selected && <Check className="h-5 w-5 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-7 space-y-3">
            <Label className="text-sm font-extrabold text-[hsl(var(--returning-ink))]">Dietary notes</Label>
            <button
              type="button"
              aria-pressed={selectedDietary.has('No restrictions')}
              data-selected={selectedDietary.has('No restrictions')}
              onClick={() => handleDietaryChange('No restrictions')}
              className="returning-choice-row returning-none-choice"
            >
              <span className="returning-choice-icon">
                <Leaf className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-extrabold text-[hsl(var(--returning-ink))]">No restrictions</span>
                <span className="returning-copy text-sm">Use this when there is nothing special to avoid.</span>
              </span>
              {selectedDietary.has('No restrictions') && <Check className="h-5 w-5 text-primary" />}
            </button>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {remainingDietaryOptions.map((option) => {
                const selected = selectedDietary.has(option);
                return (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={selected}
                    data-selected={selected}
                    onClick={() => handleDietaryChange(option)}
                    className="returning-diet-chip"
                  >
                    <span>{option}</span>
                    {selected && <Check className="h-4 w-4 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="returning-actions">
            <Button variant="outline" className="returning-secondary-cta" onClick={() => setActiveSection('hub')}>
              Settings
            </Button>
            <Button className="returning-primary-cta" onClick={handleSaveProfile}>
              Save profile
            </Button>
          </div>
        </section>
      </div>
    );
  };

  const renderActiveSection = () => {
    if (activeSection === 'pantry') return renderInventorySection('pantry');
    if (activeSection === 'kitchen') return renderInventorySection('kitchen');
    if (activeSection === 'profile') return renderProfileSection();
    return renderHub();
  };

  return (
    <main className="returning-ui min-h-screen pb-24">
      <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-4 py-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            className="returning-back-button"
            onClick={onBackToPlanning}
          >
            Back
          </Button>
          <span className="returning-mini-chip">Settings</span>
        </div>

        {renderActiveSection()}
      </div>

      {/* Pantry Camera Dialog */}
      <Dialog open={showPantryCamera} onOpenChange={setShowPantryCamera}>
        <DialogContent className="settings-camera-dialog sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scan Your Pantry</DialogTitle>
            <DialogDescription>
              Take a photo of your pantry and I'll identify the ingredients for you.
            </DialogDescription>
          </DialogHeader>
          
          <NativeCamera
            title="Scan pantry"
            variant="setup"
            setupTone="pantry"
            captureLabel="Capture pantry"
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
        <DialogContent className="settings-camera-dialog settings-camera-dialog-kitchen sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scan Your Kitchen</DialogTitle>
            <DialogDescription>
              Take a photo of your kitchen and I'll identify the equipment you have.
            </DialogDescription>
          </DialogHeader>
          
          <NativeCamera
            title="Scan kitchen"
            variant="setup"
            setupTone="kitchen"
            captureLabel="Capture kitchen"
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
    </main>
  );
}
