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
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useResetPantry, useUpdateUserProfile } from '@/hooks/useAuth';
import { useDeleteCookingSession, useDeleteAllCookingSessions } from '@/hooks/useCookingSession';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { NativeCamera } from '@/components/ui/native-camera';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { Camera, Trash2, Plus, Settings, ChefHat, Package, Bell, User, Upload, Clock, MoreVertical, History } from 'lucide-react';
import { analyzeImage } from '@/lib/openai';
import type { CookingSession } from '@shared/schema';
import type { RecipeSnapshotData } from '@/hooks/useCookingSession';

interface UserProfile {
  cookingSkill: string;
  dietaryRestrictions: string[];
  weeklyTime: string;
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
    { value: 'beginner', label: 'Beginner', description: 'I can make basic dishes like pasta or sandwiches' },
    { value: 'intermediate', label: 'Intermediate', description: 'I can follow recipes and cook most dishes' },
    { value: 'expert', label: 'Expert', description: 'I can cook complex dishes and modify recipes' }
  ];

  const dietaryOptions = [
    'None', 'Gluten Free', 'Vegetarian', 'Vegan', 'Dairy Free', 
    'No Red Meat', 'Halal', 'Kosher', 'Keto', 'Paleo'
  ];

  const timeOptions = [
    { value: '1-2', label: '1-2 hours per week' },
    { value: '3-5', label: '3-5 hours per week' },
    { value: '6-10', label: '6-10 hours per week' },
    { value: '10+', label: 'More than 10 hours per week' }
  ];

  const [showPantryCamera, setShowPantryCamera] = useState(false);
  const [showEquipmentCamera, setShowEquipmentCamera] = useState(false);
  const [isAnalyzingPantry, setIsAnalyzingPantry] = useState(false);
  const [isAnalyzingEquipment, setIsAnalyzingEquipment] = useState(false);
  const { toast } = useToast();

  // Handler functions matching the initial profiling
  const handleDietaryChange = (restriction: string) => {
    if (restriction === 'None') {
      setProfile(prev => ({ ...prev, dietaryRestrictions: ['None'] }));
    } else {
      setProfile(prev => ({
        ...prev,
        dietaryRestrictions: prev.dietaryRestrictions.includes('None')
          ? [restriction]
          : prev.dietaryRestrictions.includes(restriction)
          ? prev.dietaryRestrictions.filter(r => r !== restriction)
          : [...prev.dietaryRestrictions.filter(r => r !== 'None'), restriction]
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
        dietaryRestrictions: profile.dietaryRestrictions,
        weeklyTime: profile.weeklyTime
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

  const handlePantryImageAnalysis = async (imageData: string) => {
    setIsAnalyzingPantry(true);
    try {
      // Detect if image is HEIC format
      const isHEIC = imageData.includes('data:image/heic') || imageData.includes('data:image/heif');
      
      const result = await analyzeImage(imageData, isHEIC);
      console.log('Pantry image analysis result:', result);
      
      // Parse the response to extract ingredients from the ingredients array
      let detectedIngredients: string[] = [];
      
      // Check if result has ingredients array
      if (result.ingredients && Array.isArray(result.ingredients)) {
        detectedIngredients = result.ingredients.map((item: any) => 
          typeof item === 'string' ? item : item.name || item.ingredient || String(item)
        );
      }
      
      // Also try to extract from text fields as fallback
      const analysisText = result.analysis || result.description || '';
      if (analysisText && detectedIngredients.length === 0) {
        const textIngredients = analysisText.match(/\b(?:flour|sugar|eggs|milk|butter|oil|onions|garlic|tomatoes|cheese|bread|rice|pasta|chicken|beef|fish|salt|pepper|herbs|spices|vegetables|fruits|beans|nuts|potatoes|carrots|lettuce|spinach|broccoli|mushrooms|bell peppers|cucumbers|avocado|bananas|apples|oranges|lemons|limes|berries|yogurt|cream|vinegar|soy sauce|olive oil|coconut oil|honey|maple syrup|vanilla|cinnamon|paprika|cumin|oregano|basil|thyme|rosemary|ginger|turmeric|chili|hot sauce|ketchup|mustard|mayonnaise|pasta sauce|coconut milk|almond milk|quinoa|oats|cereal|crackers|cookies|chocolate|coffee|tea|wine|beer|juice|water|ice|frozen foods|canned goods|condiments|sauces|dressings|seasonings|baking powder|baking soda|yeast|stock|broth)\b/gi) || [];
        detectedIngredients = [...detectedIngredients, ...textIngredients];
      }
      
      if (detectedIngredients.length > 0) {
        // Clean and remove duplicates
        const cleanIngredients = detectedIngredients
          .map(i => i.toLowerCase().trim())
          .filter(i => i && i.length > 1);
        const uniqueIngredients = Array.from(new Set(cleanIngredients)) as string[];
        const newIngredients = Array.from(new Set([...profile.pantryIngredients, ...uniqueIngredients])) as string[];
        setProfile(prev => ({ ...prev, pantryIngredients: newIngredients }));
        
        toast({
          title: "Pantry scan complete",
          description: `Found ${uniqueIngredients.length} ingredients: ${uniqueIngredients.slice(0, 3).join(', ')}${uniqueIngredients.length > 3 ? '...' : ''}`
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
      
      const result = await analyzeImage(imageData, isHEIC);
      console.log('Equipment image analysis result:', result);
      
      // Parse the response to extract kitchen equipment from the equipment array
      let detectedEquipment: string[] = [];
      
      // Check if result has equipment array
      if (result.equipment && Array.isArray(result.equipment)) {
        detectedEquipment = result.equipment.map((item: any) => {
          if (typeof item === 'string') {
            return item;
          } else if (typeof item === 'object' && item !== null) {
            return item.name || item.item || item.equipment || item.description || '';
          } else {
            return '';
          }
        }).filter((item: string) => item && typeof item === 'string' && item.trim().length > 0);
      }
      
      // Also try to extract from text fields as fallback
      const analysisText = result.analysis || result.description || '';
      if (analysisText && detectedEquipment.length === 0) {
        const textEquipment = analysisText.match(/\b(?:stove|oven|microwave|refrigerator|freezer|dishwasher|blender|mixer|food processor|toaster|coffee maker|coffee machine|espresso machine|kettle|slow cooker|pressure cooker|air fryer|grill|griddle|wok|skillet|frying pan|pan|pot|small pot|large pot|saucepan|stockpot|dutch oven|red dutch oven|blue dutch oven|baking sheet|cutting board|knife|chef knife|santoku|santoku knife|paring knife|bread knife|cleaver|peeler|grater|whisk|spatula|tongs|ladle|colander|strainer|measuring cups|measuring spoons|scale|thermometer|timer|can opener|bottle opener|corkscrew|rolling pin|pastry brush|mortar pestle|stand mixer|hand mixer|immersion blender|juicer|mandoline|kitchen shears|salad spinner|ice cream maker|bread maker|rice cooker|steamer|fondue pot|waffle maker|pancake griddle|deep fryer|smoker|dehydrator|vacuum sealer|sous vide|instant pot|ninja|kitchenaid|cuisinart|vitamix|breville)\b/gi) || [];
        detectedEquipment = [...detectedEquipment, ...textEquipment];
      }
      
      if (detectedEquipment.length > 0) {
        // Clean and remove duplicates
        const cleanEquipment = detectedEquipment
          .map(e => e.toLowerCase().trim())
          .filter(e => e && e.length > 1);
        const uniqueEquipment = Array.from(new Set(cleanEquipment)) as string[];
        const newEquipment = Array.from(new Set([...profile.kitchenEquipment, ...uniqueEquipment])) as string[];
        setProfile(prev => ({ ...prev, kitchenEquipment: newEquipment }));
        
        toast({
          title: "Kitchen scan complete",
          description: `Found ${uniqueEquipment.length} items: ${uniqueEquipment.slice(0, 3).join(', ')}${uniqueEquipment.length > 3 ? '...' : ''}`
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

    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const processedFiles = Array.from(files).filter(file => {
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

    if (processedFiles.length !== files.length) {
      toast({
        title: "Some files skipped",
        description: `${files.length - processedFiles.length} files were skipped (unsupported format). Processing ${processedFiles.length} images.`
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

    try {
      // Process files sequentially to avoid overwhelming the API
      for (let i = 0; i < processedFiles.length; i++) {
        const file = processedFiles[i];
        const fileType = file.type.toLowerCase();
        const fileName = file.name.toLowerCase();
        const isHEIC = fileName.endsWith('.heic') || fileName.endsWith('.heif');

        try {
          let result;
          if (isHEIC) {
            // Handle HEIC files
            const reader = new FileReader();
            result = await new Promise<any>((resolve, reject) => {
              reader.onload = async (e) => {
                try {
                  const base64 = e.target?.result as string;
                  const base64Data = base64.split(',')[1];
                  const analysisResult = await analyzeImage(base64Data, true);
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
            result = await analyzeImage(compressedBase64, false);
          }

          // Extract ingredients or equipment from this image
          if (type === 'pantry' && result) {
            let detectedIngredients: string[] = [];
            
            if (result.ingredients && Array.isArray(result.ingredients)) {
              detectedIngredients = result.ingredients.map((item: any) => 
                typeof item === 'string' ? item : item.name || item.ingredient || String(item)
              );
            }
            
            if (detectedIngredients.length > 0) {
              const cleanIngredients = detectedIngredients
                .map(i => i.toLowerCase().trim())
                .filter(i => i && i.length > 1);
              allNewIngredients = [...allNewIngredients, ...cleanIngredients];
              console.log('Added ingredients:', cleanIngredients);
            }
          } else if (type === 'kitchen' && result) {
            let detectedEquipment: string[] = [];
            
            if (result.equipment && Array.isArray(result.equipment)) {
              detectedEquipment = result.equipment.map((item: any) => {
                if (typeof item === 'string') {
                  return item;
                } else if (typeof item === 'object' && item !== null) {
                  return item.name || item.item || item.equipment || item.description || '';
                } else {
                  return '';
                }
              }).filter((item: string) => item && typeof item === 'string' && item.trim().length > 0);
            }
            
            if (detectedEquipment.length > 0) {
              const cleanEquipment = detectedEquipment
                .map(e => e.toLowerCase().trim())
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
        const uniqueNewIngredients = Array.from(new Set(allNewIngredients));
        setProfile(prev => ({
          ...prev,
          pantryIngredients: Array.from(new Set([...prev.pantryIngredients, ...uniqueNewIngredients]))
        }));
        toast({
          title: `Scan complete!`,
          description: `Found ${uniqueNewIngredients.length} ingredients across ${processedFiles.length} image(s).`
        });
      } else if (type === 'kitchen' && allNewEquipment.length > 0) {
        const uniqueNewEquipment = Array.from(new Set(allNewEquipment));
        setProfile(prev => ({
          ...prev,
          kitchenEquipment: Array.from(new Set([...prev.kitchenEquipment, ...uniqueNewEquipment]))
        }));
        toast({
          title: `Scan complete!`,
          description: `Found ${uniqueNewEquipment.length} equipment items across ${processedFiles.length} image(s).`
        });
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
                        const newIngredients = input.value.split(',').map(i => i.trim()).filter(i => i.length > 0);
                        setProfile(prev => ({
                          ...prev,
                          pantryIngredients: [...prev.pantryIngredients, ...newIngredients]
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
                        const newEquipment = input.value.split(',').map(i => i.trim()).filter(i => i.length > 0);
                        setProfile(prev => ({
                          ...prev,
                          kitchenEquipment: [...prev.kitchenEquipment, ...newEquipment]
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
                <RadioGroup 
                  value={profile.cookingSkill} 
                  onValueChange={(value) => setProfile(prev => ({ ...prev, cookingSkill: value }))}
                  className="mt-2"
                >
                  {skillLevels.map((skill) => (
                    <div key={skill.value} className="flex items-start space-x-3 space-y-0">
                      <RadioGroupItem value={skill.value} id={skill.value} className="mt-1" />
                      <div className="space-y-1 leading-none">
                        <Label htmlFor={skill.value} className="font-medium">{skill.label}</Label>
                        <p className="text-sm text-muted-foreground">{skill.description}</p>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label>Weekly Cooking Time</Label>
                <RadioGroup 
                  value={profile.weeklyTime} 
                  onValueChange={(value) => setProfile(prev => ({ ...prev, weeklyTime: value }))}
                  className="mt-2"
                >
                  {timeOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={option.value} />
                      <Label htmlFor={option.value}>{option.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label>Dietary Restrictions</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {dietaryOptions.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        id={option}
                        checked={profile.dietaryRestrictions.includes(option)}
                        onCheckedChange={() => handleDietaryChange(option)}
                      />
                      <Label htmlFor={option} className="text-sm">{option}</Label>
                    </div>
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
