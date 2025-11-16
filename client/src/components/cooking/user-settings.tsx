import { useState, useEffect } from 'react';
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
import { useResetPantry, useResetProfile, useUpdateUserProfile } from '@/hooks/useAuth';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { NativeCamera } from '@/components/ui/native-camera';
import { useToast } from '@/hooks/use-toast';
import { Camera, Trash2, Plus, Settings, ChefHat, Package, Bell, User, Upload } from 'lucide-react';

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
  const [newIngredient, setNewIngredient] = useState('');
  const [newEquipment, setNewEquipment] = useState('');
  const [isAnalyzingPantry, setIsAnalyzingPantry] = useState(false);
  const [isAnalyzingEquipment, setIsAnalyzingEquipment] = useState(false);
  const [notifications, setNotifications] = useState({
    mealReminders: true,
    groceryAlerts: true,
    cookingTips: false,
    weeklyPlanning: true
  });
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


  const addIngredient = () => {
    if (newIngredient.trim() && !profile.pantryIngredients.includes(newIngredient.trim())) {
      setProfile(prev => ({
        ...prev,
        pantryIngredients: [...prev.pantryIngredients, newIngredient.trim()]
      }));
      setNewIngredient('');
    }
  };

  const removeIngredient = (ingredient: string) => {
    setProfile(prev => ({
      ...prev,
      pantryIngredients: prev.pantryIngredients.filter(i => i !== ingredient)
    }));
  };

  const resetPantryMutation = useResetPantry();
  const resetProfileMutation = useResetProfile();
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

  const handleStartOver = async () => {
    if (window.confirm('Are you sure you want to start over? This will delete your entire profile including pantry, equipment, and all preferences. You will go through the onboarding process again.')) {
      try {
        await resetProfileMutation.mutateAsync();
        
        toast({
          title: "Profile Reset",
          description: "Your profile has been reset. Reloading app...",
        });
        
        // Force a full page reload and clear all cache
        setTimeout(() => {
          window.location.href = '/cooking';
        }, 800);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to reset profile. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const addEquipment = () => {
    if (newEquipment.trim() && !profile.kitchenEquipment.includes(newEquipment.trim())) {
      setProfile(prev => ({
        ...prev,
        kitchenEquipment: [...prev.kitchenEquipment, newEquipment.trim()]
      }));
      setNewEquipment('');
    }
  };

  const removeEquipment = (equipment: string) => {
    setProfile(prev => ({
      ...prev,
      kitchenEquipment: prev.kitchenEquipment.filter(e => e !== equipment)
    }));
  };

  const handleSave = () => {
    onProfileUpdate(profile);
    toast({
      title: "Settings saved!",
      description: "Your preferences have been updated successfully."
    });
  };

  const handlePantryImageCapture = async (imageData: string) => {
    await handlePantryImageAnalysis(imageData);
  };

  const handleEquipmentImageCapture = async (imageData: string) => {
    await handleEquipmentImageAnalysis(imageData);
  };

  const handlePantryImageAnalysis = async (imageData: string) => {
    setIsAnalyzingPantry(true);
    try {
      // Detect if image is HEIC format
      const isHEIC = imageData.includes('data:image/heic') || imageData.includes('data:image/heif');
      
      // Use vision API to analyze pantry image
      const response = await fetch('/api/vision/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          image: imageData,
          isHEIC: isHEIC
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze image');
      }

      const result = await response.json();
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
      
      const response = await fetch('/api/vision/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          image: imageData,
          isHEIC: isHEIC
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze image');
      }

      const result = await response.json();
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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'pantry' | 'kitchen') => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Convert file to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (type === 'pantry') {
        handlePantryImageAnalysis(base64);
      } else {
        handleEquipmentImageAnalysis(base64);
      }
    };
    reader.readAsDataURL(file);

    // Reset input
    event.target.value = '';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Kitchen & Settings</h1>
          <p className="text-muted-foreground">Manage your kitchen setup and preferences</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBackToPlanning}>
            Back to Planning
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="kitchen" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="kitchen" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            My Kitchen
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kitchen" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Pantry Ingredients
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowPantryCamera(true)}
                    className="flex items-center gap-2"
                    disabled={isAnalyzingPantry}
                  >
                    <Camera className="h-4 w-4" />
                    Take Photo
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('pantry-upload')?.click()}
                    className="flex items-center gap-2"
                    disabled={isAnalyzingPantry}
                  >
                    <Upload className="h-4 w-4" />
                    Upload Image
                  </Button>
                  <input
                    id="pantry-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'pantry')}
                    className="hidden"
                  />
                  {isAnalyzingPantry && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      Analyzing image...
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="Add ingredient..."
                    value={newIngredient}
                    onChange={(e) => setNewIngredient(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addIngredient()}
                  />
                  <Button onClick={addIngredient} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {profile.pantryIngredients.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleStartOver}
                      disabled={resetProfileMutation.isPending}
                      className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                    >
                      {resetProfileMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600 mr-2"></div>
                          Resetting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-3 w-3 mr-1" />
                          Start Over
                        </>
                      )}
                    </Button>
                  </div>
                )}

                <div className="max-h-60 overflow-y-auto space-y-2">
                  {profile.pantryIngredients.map((ingredient, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="text-sm">{ingredient}</span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeIngredient(ingredient)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Kitchen Equipment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowEquipmentCamera(true)}
                    className="flex items-center gap-2"
                    disabled={isAnalyzingEquipment}
                  >
                    <Camera className="h-4 w-4" />
                    Take Photo
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('equipment-upload')?.click()}
                    className="flex items-center gap-2"
                    disabled={isAnalyzingEquipment}
                  >
                    <Upload className="h-4 w-4" />
                    Upload Image
                  </Button>
                  <input
                    id="equipment-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'kitchen')}
                    className="hidden"
                  />
                  {isAnalyzingEquipment && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      Analyzing image...
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="Add equipment..."
                    value={newEquipment}
                    onChange={(e) => setNewEquipment(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addEquipment()}
                  />
                  <Button onClick={addEquipment} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2">
                  {profile.kitchenEquipment.map((equipment, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="text-sm">{equipment}</span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeEquipment(equipment)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
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
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="meal-reminders">Meal Reminders</Label>
                  <div className="text-sm text-muted-foreground">
                    Get notified when it's time to start cooking
                  </div>
                </div>
                <Switch
                  id="meal-reminders"
                  checked={notifications.mealReminders}
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, mealReminders: checked }))}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="grocery-alerts">Grocery Alerts</Label>
                  <div className="text-sm text-muted-foreground">
                    Alerts for sales on ingredients you use frequently
                  </div>
                </div>
                <Switch
                  id="grocery-alerts"
                  checked={notifications.groceryAlerts}
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, groceryAlerts: checked }))}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="cooking-tips">Daily Cooking Tips</Label>
                  <div className="text-sm text-muted-foreground">
                    Receive helpful cooking tips and techniques
                  </div>
                </div>
                <Switch
                  id="cooking-tips"
                  checked={notifications.cookingTips}
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, cookingTips: checked }))}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="weekly-planning">Weekly Planning</Label>
                  <div className="text-sm text-muted-foreground">
                    Weekly meal planning suggestions
                  </div>
                </div>
                <Switch
                  id="weekly-planning"
                  checked={notifications.weeklyPlanning}
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, weeklyPlanning: checked }))}
                />
              </div>
            </CardContent>
          </Card>
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
            onImageCapture={handlePantryImageCapture}
            onError={(error: string) => {
              console.error('Camera error:', error);
              toast({
                title: "Camera Error",
                description: error,
                variant: "destructive"
              });
            }}
            title="Take Photo of Pantry"
          />
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPantryCamera(false)}>
              Cancel
            </Button>
          </DialogFooter>
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
            onImageCapture={handleEquipmentImageCapture}
            onError={(error: string) => {
              console.error('Camera error:', error);
              toast({
                title: "Camera Error",
                description: error,
                variant: "destructive"
              });
            }}
            title="Take Photo of Kitchen"
          />
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEquipmentCamera(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}