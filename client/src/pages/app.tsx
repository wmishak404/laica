import { useState } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import UserProfiling from '@/components/cooking/user-profiling';
import MealPlanning from '@/components/cooking/meal-planning';
import LiveCooking from '@/components/cooking/live-cooking';
import UserSettings from '@/components/cooking/user-settings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChefHat, Settings, Home, ShoppingCart, LogOut, User } from 'lucide-react';

interface UserProfile {
  cookingSkill: string;
  dietaryRestrictions: string[];
  weeklyTime: string;
  pantryIngredients: string[];
  kitchenEquipment: string[];
  favoriteChefs: string[];
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

type WorkflowPhase = 'welcome' | 'profiling' | 'planning' | 'cooking' | 'settings';

export default function MobileApp() {
  const { user } = useAuth();
  const [currentPhase, setCurrentPhase] = useState<WorkflowPhase>('welcome');
  const [userProfile, setUserProfile] = useState<UserProfile>({
    cookingSkill: '',
    dietaryRestrictions: [],
    weeklyTime: '',
    pantryIngredients: [],
    kitchenEquipment: [],
    favoriteChefs: []
  });
  const [selectedMeal, setSelectedMeal] = useState<RecipeRecommendation | null>(null);
  const [scheduledTime, setScheduledTime] = useState<string>('');

  const handleProfileComplete = (profile: UserProfile) => {
    setUserProfile(profile);
    setCurrentPhase('planning');
  };

  const handleMealSelected = (meal: RecipeRecommendation, scheduledTime: string) => {
    setSelectedMeal(meal);
    setScheduledTime(scheduledTime);
    setCurrentPhase('cooking');
  };

  const handleBackToPlanning = () => {
    setCurrentPhase('planning');
  };

  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    setUserProfile(updatedProfile);
    setCurrentPhase('planning');
  };

  const renderBottomNav = () => {
    if (currentPhase === 'cooking') return null;

    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="flex justify-around items-center max-w-md mx-auto">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setCurrentPhase('welcome')}
            className={`flex flex-col items-center ${currentPhase === 'welcome' ? 'text-[#FF6B6B]' : 'text-gray-500'}`}
          >
            <Home className="h-5 w-5 mb-1" />
            <span className="text-xs">Home</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => currentPhase !== 'profiling' && setCurrentPhase('planning')}
            className={`flex flex-col items-center ${currentPhase === 'planning' ? 'text-[#FF6B6B]' : 'text-gray-500'}`}
            disabled={userProfile.cookingSkill === ''}
          >
            <ChefHat className="h-5 w-5 mb-1" />
            <span className="text-xs">Cook</span>
          </Button>

          <Link href="/grocery-list">
            <Button 
              variant="ghost" 
              size="sm"
              className="flex flex-col items-center text-gray-500"
            >
              <ShoppingCart className="h-5 w-5 mb-1" />
              <span className="text-xs">Grocery</span>
            </Button>
          </Link>

          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setCurrentPhase('settings')}
            className={`flex flex-col items-center ${currentPhase === 'settings' ? 'text-[#FF6B6B]' : 'text-gray-500'}`}
            disabled={userProfile.cookingSkill === ''}
          >
            <Settings className="h-5 w-5 mb-1" />
            <span className="text-xs">Settings</span>
          </Button>
        </div>
      </div>
    );
  };

  const renderWelcomeScreen = () => (
    <div className="min-h-screen bg-gradient-to-b from-[#FF6B6B]/10 to-white flex flex-col justify-center items-center p-6">
      <div className="text-center mb-8">
        <div className="bg-[#FF6B6B] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <ChefHat className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Laica</h1>
        <p className="text-lg text-gray-600 mb-8">Your Live AI Cooking Assistant</p>
        
        <Card className="max-w-sm mx-auto">
          <CardContent className="p-6">
            <p className="text-gray-700 mb-6 text-center">
              Let's get started by learning about your cooking style and preferences.
            </p>
            <Button 
              onClick={() => setCurrentPhase('profiling')}
              className="w-full bg-[#FF6B6B] hover:bg-[#FF5252] text-white py-3 text-lg"
            >
              Get Started
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderCurrentPhase = () => {
    switch (currentPhase) {
      case 'welcome':
        return renderWelcomeScreen();
        
      case 'profiling':
        return (
          <div className="pb-20">
            <UserProfiling onProfileComplete={handleProfileComplete} />
          </div>
        );
        
      case 'planning':
        return (
          <div className="pb-20">
            <MealPlanning 
              userProfile={userProfile}
              onMealSelected={handleMealSelected}
              onBackToProfile={() => setCurrentPhase('profiling')}
            />
          </div>
        );
        
      case 'cooking':
        return selectedMeal ? (
          <LiveCooking 
            selectedMeal={selectedMeal}
            scheduledTime={scheduledTime}
            onBackToPlanning={handleBackToPlanning}
          />
        ) : null;
        
      case 'settings':
        return (
          <div className="pb-20">
            <UserSettings
              userProfile={userProfile}
              onProfileUpdate={handleProfileUpdate}
              onBackToPlanning={() => setCurrentPhase('planning')}
            />
          </div>
        );
        
      default:
        return renderWelcomeScreen();
    }
  };

  const renderHeader = () => (
    <div className="fixed top-0 left-0 right-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between max-w-md mx-auto">
        <div className="flex items-center space-x-3">
          <ChefHat className="h-6 w-6 text-[#FF6B6B]" />
          <span className="font-semibold text-gray-900">AI Cooking Assistant</span>
        </div>
        
        <div className="flex items-center space-x-2">
          {user && (
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.profileImageUrl || ''} alt={user.firstName || 'User'} />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-gray-700 hidden sm:block">
                {user.firstName || user.email}
              </span>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              // Handle logout for both local and OAuth users
              if (user?.authType === 'local') {
                try {
                  await fetch('/api/auth/local-logout', { method: 'POST' });
                  window.location.reload();
                } catch (error) {
                  console.error('Local logout error:', error);
                  window.location.reload();
                }
              } else {
                window.location.href = '/api/logout';
              }
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {renderHeader()}
      {renderCurrentPhase()}
      {renderBottomNav()}
    </div>
  );
}