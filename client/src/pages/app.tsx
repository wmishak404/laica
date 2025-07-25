import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import UserProfiling from '@/components/cooking/user-profiling';
import MealPlanning from '@/components/cooking/meal-planning';
import LiveCooking from '@/components/cooking/live-cooking';
import UserSettings from '@/components/cooking/user-settings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  const { toast } = useToast();
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
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Load existing profile on mount
  useEffect(() => {
    if (user?.id) {
      const savedProfile = localStorage.getItem(`cookingProfile_${user.id}`);
      if (savedProfile) {
        try {
          const parsedProfile = JSON.parse(savedProfile);
          setUserProfile(parsedProfile);
          
          // Check if profile is complete
          const isProfileComplete = parsedProfile.cookingSkill && 
            parsedProfile.weeklyTime && 
            parsedProfile.pantryIngredients.length > 0;
          
          if (isProfileComplete) {
            setCurrentPhase('planning');
          } else {
            setCurrentPhase('profiling');
          }
        } catch (error) {
          console.error('Error loading saved profile:', error);
          setCurrentPhase('welcome');
        }
      } else {
        setCurrentPhase('welcome');
      }
    }
    setIsLoadingProfile(false);
  }, [user?.id]);

  // Save profile whenever it changes
  const saveProfile = (profile: UserProfile) => {
    if (user?.id) {
      localStorage.setItem(`cookingProfile_${user.id}`, JSON.stringify(profile));
    }
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    
    // Check if it's an AuthUser (external auth)
    if ('firstName' in user && 'lastName' in user) {
      const firstName = user.firstName;
      const lastName = user.lastName;
      if (firstName && lastName) {
        return `${firstName[0]}${lastName[0]}`;
      }
    }
    
    // Check if it's a User (local auth)
    if ('username' in user) {
      const username = user.username;
      if (username) {
        return username[0].toUpperCase();
      }
    }
    
    // Fall back to email for both types
    const email = user.email;
    if (email) {
      return email[0].toUpperCase();
    }
    
    return 'U';
  };

  const getUserDisplayName = () => {
    if (!user) return 'User';
    
    // Check if it's an AuthUser (external auth)
    if ('firstName' in user && 'lastName' in user) {
      const firstName = user.firstName;
      const lastName = user.lastName;
      if (firstName && lastName) {
        return `${firstName} ${lastName}`;
      }
    }
    
    // Check if it's a User (local auth)
    if ('username' in user) {
      const username = user.username;
      if (username) {
        return username;
      }
    }
    
    // Fall back to email for both types
    const email = user.email;
    if (email) {
      return email;
    }
    
    return 'User';
  };

  const handleLogout = () => {
    // For Replit Auth users, redirect to logout endpoint
    if (user?.id && typeof user.id === 'string') {
      window.location.href = '/api/logout';
    } else {
      // For local users, make a logout request
      fetch('/api/auth/logout', { method: 'POST' })
        .then(() => {
          window.location.href = '/';
        })
        .catch((error) => {
          console.error('Logout error:', error);
          window.location.href = '/';
        });
    }
  };

  const handleProfileComplete = (profile: UserProfile) => {
    setUserProfile(profile);
    saveProfile(profile);
    
    // Show confirmation toast with link to settings
    toast({
      title: "Profile Updated Successfully",
      description: (
        <div>
          Your cooking profile has been saved. Ready to find your perfect meal?{' '}
          <button 
            onClick={() => setCurrentPhase('settings')}
            className="underline text-blue-600 hover:text-blue-800"
          >
            Make changes here
          </button>
        </div>
      ),
      duration: 5000,
    });
    
    setCurrentPhase('planning');
  };

  const handleMealSelected = (meal: RecipeRecommendation, scheduledTime: string) => {
    setSelectedMeal(meal);
    setScheduledTime(scheduledTime);
    setCurrentPhase('cooking');
  };

  const handleBackToPlanning = () => {
    // Check if profile is complete before allowing access to planning
    const isProfileComplete = userProfile.cookingSkill && 
      userProfile.weeklyTime && 
      userProfile.pantryIngredients.length > 0;
    
    if (isProfileComplete) {
      setCurrentPhase('planning');
    } else {
      // If profile is incomplete, go back to profiling step
      setCurrentPhase('profiling');
    }
  };

  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    setUserProfile(updatedProfile);
    saveProfile(updatedProfile);
    
    // Check if profile is complete before going to planning
    const isProfileComplete = updatedProfile.cookingSkill && 
      updatedProfile.weeklyTime && 
      updatedProfile.pantryIngredients.length > 0;
    
    if (isProfileComplete) {
      // Show confirmation toast with link to settings
      toast({
        title: "Profile Updated Successfully",
        description: (
          <div>
            Your cooking profile has been updated. Ready to find your perfect meal?{' '}
            <button 
              onClick={() => setCurrentPhase('settings')}
              className="underline text-blue-600 hover:text-blue-800"
            >
              Make changes here
            </button>
          </div>
        ),
        duration: 5000,
      });
      
      setCurrentPhase('planning');
    } else {
      setCurrentPhase('profiling');
    }
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
        <p className="text-lg text-gray-600 mb-8">Your Live Cooking Assistant</p>
        
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

  // Check if user has an existing profile
  const hasExistingProfile = () => {
    return userProfile.cookingSkill && 
           userProfile.weeklyTime && 
           userProfile.pantryIngredients.length > 0;
  };

  if (isLoadingProfile) {
    return (
      <div className="w-full max-w-2xl mx-auto p-4 md:p-6 min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B6B] mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Loading Your Profile</h2>
          <p className="text-gray-600">Setting up your personalized cooking experience...</p>
        </Card>
      </div>
    );
  }

  const renderCurrentPhase = () => {
    switch (currentPhase) {
      case 'welcome':
        return renderWelcomeScreen();
        
      case 'profiling':
        return (
          <div className="pb-20">
            <UserProfiling 
              onProfileComplete={handleProfileComplete}
              existingProfile={hasExistingProfile() ? userProfile : undefined}
            />
          </div>
        );
        
      case 'planning':
        return (
          <div className="pb-20">
            <MealPlanning 
              userProfile={userProfile}
              onMealSelected={handleMealSelected}
              onBackToProfile={() => setCurrentPhase('settings')}
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
              onBackToPlanning={handleBackToPlanning}
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
          <span className="font-semibold text-gray-900">Laica</span>
        </div>
        
        <div className="flex items-center space-x-2">
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage 
                      src={user && 'profileImageUrl' in user ? user.profileImageUrl || undefined : undefined} 
                      alt="User avatar" 
                    />
                    <AvatarFallback>
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{getUserDisplayName()}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email || 'No email'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setCurrentPhase('settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
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