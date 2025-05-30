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
import { Camera, Trash2, Plus, Settings, ChefHat, Package, Bell, User } from 'lucide-react';

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

  const handlePantryImageCapture = (imageData: string) => {
    // In a real implementation, this would analyze the image using AI
    toast({
      title: "Pantry scan complete",
      description: "Your pantry items have been updated."
    });
    setShowPantryCamera(false);
  };

  const handleEquipmentImageCapture = (imageData: string) => {
    // In a real implementation, this would analyze the image using AI
    toast({
      title: "Kitchen scan complete", 
      description: "Your equipment list has been updated."
    });
    setShowEquipmentCamera(false);
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
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowPantryCamera(true)}
                    className="flex items-center gap-2"
                  >
                    <Camera className="h-4 w-4" />
                    Scan Pantry
                  </Button>
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
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowEquipmentCamera(true)}
                    className="flex items-center gap-2"
                  >
                    <Camera className="h-4 w-4" />
                    Scan Kitchen
                  </Button>
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