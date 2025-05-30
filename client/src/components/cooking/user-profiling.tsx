import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Webcam } from '@/components/ui/webcam';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, Upload } from 'lucide-react';

interface UserProfile {
  cookingSkill: string;
  dietaryRestrictions: string[];
  weeklyTime: string;
  pantryIngredients: string[];
  kitchenEquipment: string[];
  favoriteChefs: string[];
}

interface UserProfilingProps {
  onProfileComplete: (profile: UserProfile) => void;
}

export default function UserProfiling({ onProfileComplete }: UserProfilingProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [showKitchenSettings, setShowKitchenSettings] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    cookingSkill: '',
    dietaryRestrictions: [],
    weeklyTime: '',
    pantryIngredients: [],
    kitchenEquipment: [],
    favoriteChefs: []
  });
  const [showPantryCamera, setShowPantryCamera] = useState(false);
  const [showEquipmentCamera, setShowEquipmentCamera] = useState(false);

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

  const popularChefs = [
    'Gordon Ramsay', 'Andy Cooks', 'Kenji Lopez-Alt', 'Joshua Weissman',
    'Bon Appétit', 'Epicurious', 'Modernist Kitchen', 'Salt Fat Acid Heat',
    'Babish Culinary Universe', 'Maangchi'
  ];

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

  const handleChefChange = (chef: string) => {
    setProfile(prev => ({
      ...prev,
      favoriteChefs: prev.favoriteChefs.includes(chef)
        ? prev.favoriteChefs.filter(c => c !== chef)
        : [...prev.favoriteChefs, chef]
    }));
  };

  const handlePantryAnalysis = (data: any) => {
    // For demo - user would need to provide vision API access for real implementation
    const detectedIngredients = data?.detectedIngredients || [];
    setProfile(prev => ({
      ...prev,
      pantryIngredients: [...new Set([...prev.pantryIngredients, ...detectedIngredients])]
    }));
    setShowPantryCamera(false);
  };

  const handleEquipmentAnalysis = (data: any) => {
    // For demo - user would need to provide vision API access for real implementation
    const detectedEquipment = data?.detectedEquipment || [];
    setProfile(prev => ({
      ...prev,
      kitchenEquipment: [...new Set([...prev.kitchenEquipment, ...detectedEquipment])]
    }));
    setShowEquipmentCamera(false);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle>What's your cooking skill level?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={profile.cookingSkill} onValueChange={(value) => 
                setProfile(prev => ({ ...prev, cookingSkill: value }))
              }>
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
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Any dietary restrictions or preferences?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
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
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle>How much time do you have to cook each week?</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={profile.weeklyTime} onValueChange={(value) => 
                setProfile(prev => ({ ...prev, weeklyTime: value }))
              }>
                {timeOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label htmlFor={option.value}>{option.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle>What ingredients do you have in your pantry?</CardTitle>
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
                <span className="text-sm text-muted-foreground self-center">
                  Or add ingredients manually below
                </span>
              </div>
              
              <Textarea
                placeholder="Enter ingredients separated by commas (e.g., onions, garlic, pasta, olive oil...)"
                value={profile.pantryIngredients.join(', ')}
                onChange={(e) => setProfile(prev => ({
                  ...prev,
                  pantryIngredients: e.target.value.split(',').map(i => i.trim()).filter(i => i.length > 0)
                }))}
                rows={4}
              />
              
              {profile.pantryIngredients.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {profile.pantryIngredients.map((ingredient, index) => (
                    <span key={index} className="bg-secondary/10 text-secondary text-xs px-2 py-1 rounded-full">
                      {ingredient}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 5:
        return (
          <Card>
            <CardHeader>
              <CardTitle>What kitchen equipment do you have?</CardTitle>
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
                <span className="text-sm text-muted-foreground self-center">
                  Or list equipment manually below
                </span>
              </div>
              
              <Textarea
                placeholder="Enter equipment separated by commas (e.g., stove, oven, blender, cutting board...)"
                value={profile.kitchenEquipment.join(', ')}
                onChange={(e) => setProfile(prev => ({
                  ...prev,
                  kitchenEquipment: e.target.value.split(',').map(i => i.trim()).filter(i => i.length > 0)
                }))}
                rows={4}
              />
            </CardContent>
          </Card>
        );

      case 6:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Any favorite chefs or cooking styles you enjoy?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {popularChefs.map((chef) => (
                  <div key={chef} className="flex items-center space-x-2">
                    <Checkbox
                      id={chef}
                      checked={profile.favoriteChefs.includes(chef)}
                      onCheckedChange={() => handleChefChange(chef)}
                    />
                    <Label htmlFor={chef} className="text-sm">{chef}</Label>
                  </div>
                ))}
              </div>
              
              <div className="mt-4">
                <Label htmlFor="other-chefs">Other chefs or cooking styles:</Label>
                <Input
                  id="other-chefs"
                  placeholder="Enter other influences..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      handleChefChange(e.currentTarget.value.trim());
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
        );

      case 7:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Let's confirm your cooking profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <div>
                  <strong>Cooking Level:</strong> {profile.cookingSkill}
                </div>
                <div>
                  <strong>Dietary Restrictions:</strong> {profile.dietaryRestrictions.join(', ') || 'None'}
                </div>
                <div>
                  <strong>Weekly Cooking Time:</strong> {profile.weeklyTime} hours
                </div>
                <div>
                  <strong>Pantry Items:</strong> {profile.pantryIngredients.slice(0, 8).join(', ')}
                  {profile.pantryIngredients.length > 8 && ` and ${profile.pantryIngredients.length - 8} more...`}
                </div>
                <div>
                  <strong>Kitchen Equipment:</strong> {profile.kitchenEquipment.slice(0, 6).join(', ')}
                  {profile.kitchenEquipment.length > 6 && ` and ${profile.kitchenEquipment.length - 6} more...`}
                </div>
                <div>
                  <strong>Cooking Influences:</strong> {profile.favoriteChefs.join(', ') || 'None specified'}
                </div>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg mt-4">
                <p className="text-sm text-blue-800">
                  Your preferences will evolve as I get to know your cooking style better. 
                  We can always update these settings as your skills and tastes develop.
                </p>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return profile.cookingSkill !== '';
      case 2: return profile.dietaryRestrictions.length > 0;
      case 3: return profile.weeklyTime !== '';
      case 4: return profile.pantryIngredients.length > 0;
      case 5: return profile.kitchenEquipment.length > 0;
      case 6: return true; // Optional step
      case 7: return true;
      default: return false;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Let's set up your cooking profile</h2>
        <p className="text-muted-foreground">
          Step {currentStep} of 7 - This helps me give you personalized cooking guidance
        </p>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300" 
            style={{ width: `${(currentStep / 7) * 100}%` }}
          />
        </div>
      </div>

      {renderStep()}

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
          disabled={currentStep === 1}
        >
          Previous
        </Button>
        
        {currentStep === 7 ? (
          <Button
            onClick={() => onProfileComplete(profile)}
            disabled={!canProceed()}
          >
            Complete Profile
          </Button>
        ) : (
          <Button
            onClick={() => setCurrentStep(prev => Math.min(7, prev + 1))}
            disabled={!canProceed()}
          >
            Next
          </Button>
        )}
      </div>

      {/* Camera Dialogs */}
      <Dialog open={showPantryCamera} onOpenChange={setShowPantryCamera}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Scan Your Pantry</DialogTitle>
          </DialogHeader>
          <Webcam onAnalysis={handlePantryAnalysis} />
        </DialogContent>
      </Dialog>

      <Dialog open={showEquipmentCamera} onOpenChange={setShowEquipmentCamera}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Scan Your Kitchen Equipment</DialogTitle>
          </DialogHeader>
          <Webcam onAnalysis={handleEquipmentAnalysis} />
        </DialogContent>
      </Dialog>
    </div>
  );
}