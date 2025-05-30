import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Webcam } from '@/components/ui/webcam';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
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

  const handlePantryImageAnalysis = async (imageData: string) => {
    setIsAnalyzingPantry(true);
    try {
      // Use OpenAI vision API to analyze pantry image
      const response = await fetch('/api/vision/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          image: imageData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze image');
      }

      const result = await response.json();
      
      // Parse the AI response to extract ingredients
      const detectedIngredients = result.analysis || result.description || '';
      const ingredientList = detectedIngredients.match(/\b(?:flour|sugar|eggs|milk|butter|oil|onions|garlic|tomatoes|cheese|bread|rice|pasta|chicken|beef|fish|salt|pepper|herbs|spices|vegetables|fruits|beans|nuts|potatoes|carrots|lettuce|spinach|broccoli|mushrooms|bell peppers|cucumbers|avocado|bananas|apples|oranges|lemons|limes|berries|yogurt|cream|vinegar|soy sauce|olive oil|coconut oil|honey|maple syrup|vanilla|cinnamon|paprika|cumin|oregano|basil|thyme|rosemary|ginger|turmeric|chili|hot sauce|ketchup|mustard|mayonnaise|pasta sauce|coconut milk|almond milk|quinoa|oats|cereal|crackers|cookies|chocolate|coffee|tea|wine|beer|juice|water|ice|frozen foods|canned goods|condiments|sauces|dressings|seasonings|baking powder|baking soda|yeast|stock|broth)\b/gi) || [];
      
      if (ingredientList.length > 0) {
        // Remove duplicates and add to profile
        const uniqueIngredients = [...new Set(ingredientList.map(i => i.toLowerCase()))];
        const newIngredients = [...new Set([...profile.pantryIngredients, ...uniqueIngredients])];
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
      const response = await fetch('/api/vision/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          image: imageData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze image');
      }

      const result = await response.json();
      
      // Parse the AI response to extract kitchen equipment
      const detectedEquipment = result.analysis || result.description || '';
      const equipmentList = detectedEquipment.match(/\b(?:stove|oven|microwave|refrigerator|freezer|dishwasher|blender|mixer|food processor|toaster|coffee maker|espresso machine|kettle|slow cooker|pressure cooker|air fryer|grill|griddle|wok|skillet|pan|pot|saucepan|stockpot|dutch oven|baking sheet|cutting board|knife|chef knife|paring knife|bread knife|cleaver|peeler|grater|whisk|spatula|tongs|ladle|colander|strainer|measuring cups|measuring spoons|scale|thermometer|timer|can opener|bottle opener|corkscrew|rolling pin|pastry brush|mortar pestle|stand mixer|hand mixer|immersion blender|juicer|mandoline|kitchen shears|salad spinner|ice cream maker|bread maker|rice cooker|steamer|fondue pot|waffle maker|pancake griddle|deep fryer|smoker|dehydrator|vacuum sealer|sous vide|instant pot|ninja|kitchenaid|cuisinart|vitamix|breville)\b/gi) || [];
      
      if (equipmentList.length > 0) {
        const uniqueEquipment = [...new Set(equipmentList.map(e => e.toLowerCase()))];
        const newEquipment = [...new Set([...profile.kitchenEquipment, ...uniqueEquipment])];
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="kitchen" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            My Kitchen
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <ChefHat className="h-4 w-4" />
            Cooking
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
                <Label htmlFor="skill">Cooking Skill Level</Label>
                <Input
                  id="skill"
                  value={profile.cookingSkill}
                  onChange={(e) => setProfile(prev => ({ ...prev, cookingSkill: e.target.value }))}
                  placeholder="e.g., Beginner, Intermediate, Advanced"
                />
              </div>

              <div>
                <Label htmlFor="time">Weekly Cooking Time</Label>
                <Input
                  id="time"
                  value={profile.weeklyTime}
                  onChange={(e) => setProfile(prev => ({ ...prev, weeklyTime: e.target.value }))}
                  placeholder="e.g., 5-10 hours, 10-15 hours"
                />
              </div>

              <div>
                <Label htmlFor="restrictions">Dietary Restrictions</Label>
                <Textarea
                  id="restrictions"
                  value={profile.dietaryRestrictions.join(', ')}
                  onChange={(e) => setProfile(prev => ({
                    ...prev,
                    dietaryRestrictions: e.target.value.split(',').map(r => r.trim()).filter(r => r.length > 0)
                  }))}
                  placeholder="e.g., vegetarian, gluten-free, dairy-free"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cooking Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="chefs">Favorite Chefs/Cooking Styles</Label>
                <Textarea
                  id="chefs"
                  value={profile.favoriteChefs.join(', ')}
                  onChange={(e) => setProfile(prev => ({
                    ...prev,
                    favoriteChefs: e.target.value.split(',').map(c => c.trim()).filter(c => c.length > 0)
                  }))}
                  placeholder="e.g., Gordon Ramsay, Italian cuisine, Asian fusion"
                  rows={3}
                />
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
          
          <Webcam
            onCapture={handlePantryImageCapture}
            onError={(error) => {
              console.error('Camera error:', error);
              toast({
                title: "Camera Error",
                description: "Unable to access camera. Please add ingredients manually.",
                variant: "destructive"
              });
            }}
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
          
          <Webcam
            onCapture={handleEquipmentImageCapture}
            onError={(error) => {
              console.error('Camera error:', error);
              toast({
                title: "Camera Error",
                description: "Unable to access camera. Please add equipment manually.",
                variant: "destructive"
              });
            }}
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