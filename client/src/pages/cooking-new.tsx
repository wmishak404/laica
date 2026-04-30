import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useUpdateUserProfile } from '@/hooks/useAuth';
import Footer from '@/components/layout/footer';
import UserProfiling from '@/components/cooking/user-profiling';
import MealPlanning from '@/components/cooking/meal-planning';
import LiveCooking from '@/components/cooking/live-cooking';
import UserSettings from '@/components/cooking/user-settings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ChefHat, Users, Clock, Settings, ArrowRight } from 'lucide-react';

interface UserProfile {
  cookingSkill: string;
  dietaryRestrictions: string[];
  pantryIngredients: string[];
  kitchenEquipment: string[];
  favoriteChefs: string[];
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

type WorkflowPhase = 'welcome' | 'profiling' | 'planning' | 'cooking' | 'settings';

export default function Cooking() {
  const [location, setLocation] = useLocation();
  const [currentPhase, setCurrentPhase] = useState<WorkflowPhase>('welcome');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<RecipeRecommendation | null>(null);
  const [scheduledTime, setScheduledTime] = useState<string>('');
  const [isReturningUser, setIsReturningUser] = useState(false);
  const { toast } = useToast();

  // Fetch user profile from database
  const { data: dbProfile, isLoading: isLoadingProfile } = useQuery<any>({
    queryKey: ['/api/user/profile'],
    retry: false,
  });

  const updateProfileMutation = useUpdateUserProfile();

  // Check if user has completed profile setup
  const isProfileComplete = (profile: any): boolean => {
    if (!profile) return false;
    return Boolean(
      profile.cookingSkill && 
      profile.pantryIngredients && 
      profile.pantryIngredients.length > 0
    );
  };

  // Initialize user state based on database profile
  useEffect(() => {
    if (dbProfile) {
      const hasCompleteProfile = isProfileComplete(dbProfile);
      
      if (hasCompleteProfile) {
        // Returning user with complete profile
        const profile: UserProfile = {
          cookingSkill: dbProfile.cookingSkill || '',
          dietaryRestrictions: dbProfile.dietaryRestrictions || [],
          pantryIngredients: dbProfile.pantryIngredients || [],
          kitchenEquipment: dbProfile.kitchenEquipment || [],
          favoriteChefs: dbProfile.favoriteChefs || [],
        };
        
        setUserProfile(profile);
        setIsReturningUser(true);
        setCurrentPhase('welcome');
      } else {
        // First-time user or incomplete profile
        setIsReturningUser(false);
        setCurrentPhase('welcome');
      }
    }
  }, [dbProfile]);

  const handleProfileComplete = async (profile: UserProfile) => {
    try {
      await updateProfileMutation.mutateAsync(profile);
      setUserProfile(profile);
      setIsReturningUser(true);
      setCurrentPhase('planning');
      
      toast({
        title: "Profile saved!",
        description: "Now let's find you something delicious to cook."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleMealSelected = (meal: RecipeRecommendation, scheduledTime: string) => {
    setSelectedMeal(meal);
    setScheduledTime(scheduledTime);
    setCurrentPhase('cooking');
    
    toast({
      title: "Let's start cooking!",
      description: `I'll guide you through making ${meal.recipeName}.`
    });
  };

  const resetToWelcome = () => {
    setCurrentPhase('welcome');
    setUserProfile(null);
    setSelectedMeal(null);
    setScheduledTime('');
  };

  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    setUserProfile(updatedProfile);
  };

  const renderWelcomeScreen = () => (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">Your Live Cooking Assistant</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Save money on takeout while learning to cook delicious meals with ingredients you already have at home
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Learn Your Style
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Tell me about your cooking skills, dietary needs, and kitchen setup so I can give you personalized guidance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-primary" />
              Plan Your Meals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Based on what's in your pantry and what you're craving, I'll suggest recipes that save money and reduce waste
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Cook Together
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Get live guidance while you cook with visual feedback and conversational support, just like cooking with a friend
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="text-center space-y-4">
        {isReturningUser ? (
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800">
                Welcome back! I remember your cooking preferences.
              </p>
            </div>
            <div className="flex justify-center gap-3">
              <Button onClick={() => setCurrentPhase('planning')} size="lg">
                Plan a New Meal
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => setCurrentPhase('settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Kitchen & Settings
              </Button>
            </div>
          </div>
        ) : (
          <Button onClick={() => setCurrentPhase('profiling')} size="lg">
            Get Started
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>


    </div>
  );

  const renderCurrentPhase = () => {
    switch (currentPhase) {
      case 'welcome':
        return renderWelcomeScreen();

      case 'profiling':
        return (
          <UserProfiling 
            onProfileComplete={handleProfileComplete}
            existingProfile={userProfile || undefined}
          />
        );

      case 'planning':
        return userProfile ? (
          <MealPlanning 
            userProfile={userProfile}
            onMealSelected={handleMealSelected}
            onBackToProfile={() => setCurrentPhase('welcome')}
          />
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Let's Set Up Your Profile First</h2>
              <p className="text-muted-foreground mb-6">
                I need to know about your cooking preferences and kitchen setup to recommend the best meals for you.
              </p>
              <Button onClick={() => setCurrentPhase('profiling')} size="lg">
                Set Up My Profile
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 'cooking':
        return selectedMeal ? (
          <LiveCooking 
            selectedMeal={selectedMeal}
            scheduledTime={scheduledTime}
            onBackToPlanning={() => setCurrentPhase('planning')}
          />
        ) : null;

      case 'settings':
        return userProfile ? (
          <UserSettings 
            userProfile={userProfile}
            onProfileUpdate={handleProfileUpdate}
            onBackToPlanning={() => setCurrentPhase('planning')}
          />
        ) : null;

      default:
        return renderWelcomeScreen();
    }
  };

  return (
    <>
      <main>
        <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-6 md:py-8">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">Live Cooking Assistant</h1>
                <p className="text-lg mb-4">Your personal guide to better, cheaper home cooking</p>
              </div>
              
              {currentPhase !== 'welcome' && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {currentPhase === 'profiling' && 'Setting Up Profile'}
                    {currentPhase === 'planning' && 'Planning Meal'}
                    {currentPhase === 'cooking' && 'Live Cooking'}
                    {currentPhase === 'settings' && 'Kitchen & Settings'}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={resetToWelcome}
                  >
                    Start Over
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="py-8 md:py-12 bg-white">
          <div className="container mx-auto px-4">
            {renderCurrentPhase()}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
