import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'wouter';
import { useAuth, useUserProfile, useUpdateUserProfile } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import UserProfiling from '@/components/cooking/user-profiling';
import MealPlanning from '@/components/cooking/meal-planning';
import SlopBowl from '@/components/cooking/slop-bowl';
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
import { Settings, Home, LogOut, User, MessageCircle, ChefHat } from 'lucide-react';
import laicaLogo from '@assets/laica_logo_v1_cropped_1763444931884.png';
import { FeedbackModal } from '@/components/feedback/feedback-modal';

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
  recipeName: string;
  description: string;
  cookTime: number;
  difficulty: string;
  cuisine: string;
  pantryMatch: number;
  missingIngredients: string[];
  // Slop Bowl additions (all optional — manual flow leaves them undefined)
  isFusion?: boolean;
  ingredients?: string[];      // actual pantry items used — fed to cooking steps
  equipment?: string[];        // user's kitchen equipment — fed to cooking steps
  overview?: string;           // short tagline from slop-bowl response
}

type WorkflowPhase = 'welcome' | 'profiling' | 'planning' | 'cooking' | 'settings' | 'slop-bowl';

const SLOP_BOWL_STICKER_TAGLINES = [
  'MAKE GOOD SLOP',
  'LESS BRAIN POWER',
  'NO RULES',
  'FLAVOR ROULETTE',
];

export default function MobileApp() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: dbProfile, isLoading: isLoadingDbProfile } = useUserProfile();
  const updateProfileMutation = useUpdateUserProfile();
  const [currentPhase, setCurrentPhase] = useState<WorkflowPhase>('welcome');
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
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
  const [hasLoadedFromDb, setHasLoadedFromDb] = useState(false);
  const [showPlanningChoice, setShowPlanningChoice] = useState(true);

  // Picks a fresh random tagline for the Slop Bowl sticker each time the
  // planning-choice screen is shown. Stable across re-renders while visible.
  const slopBowlStickerTagline = useMemo(
    () => SLOP_BOWL_STICKER_TAGLINES[Math.floor(Math.random() * SLOP_BOWL_STICKER_TAGLINES.length)],
    [showPlanningChoice]
  );

  // Load profile from database - database is the single source of truth
  useEffect(() => {
    if (!user?.id) return;
    
    // Wait for database query to complete
    if (isLoadingDbProfile) return;
    
    // Prevent multiple loads
    if (hasLoadedFromDb) return;
    setHasLoadedFromDb(true);

    // Database is the source of truth - always use database data
    if (dbProfile?.user) {
      const dbUser = dbProfile.user;
      const profileFromDb: UserProfile = {
        cookingSkill: dbUser.cookingSkill || '',
        dietaryRestrictions: dbUser.dietaryRestrictions || [],
        weeklyTime: dbUser.weeklyTime || '',
        pantryIngredients: dbUser.pantryIngredients || [],
        kitchenEquipment: dbUser.kitchenEquipment || [],
        favoriteChefs: dbUser.favoriteChefs || []
      };

      console.log('Loading profile from database (source of truth)');
      setUserProfile(profileFromDb);
      
      // Check if profile is complete
      const isProfileComplete = profileFromDb.cookingSkill && 
        profileFromDb.weeklyTime && 
        profileFromDb.pantryIngredients.length > 0;
      
      if (isProfileComplete) {
        setCurrentPhase('planning');
      } else {
        setCurrentPhase('profiling');
      }
      setIsLoadingProfile(false);
      return;
    }

    // No database profile found - start fresh
    console.log('No database profile found, starting fresh');
    setCurrentPhase('welcome');
    setIsLoadingProfile(false);
  }, [user?.id, dbProfile, isLoadingDbProfile, hasLoadedFromDb]);

  // Save profile to database
  const saveProfileToDb = useCallback(async (profile: UserProfile) => {
    try {
      await updateProfileMutation.mutateAsync({
        cookingSkill: profile.cookingSkill || undefined,
        dietaryRestrictions: profile.dietaryRestrictions,
        weeklyTime: profile.weeklyTime || undefined,
        pantryIngredients: profile.pantryIngredients,
        kitchenEquipment: profile.kitchenEquipment,
        favoriteChefs: profile.favoriteChefs,
      });
      console.log('Profile saved to database successfully');
    } catch (error) {
      console.error('Error saving profile to database:', error);
      toast({
        title: "Failed to save changes",
        description: "Your changes couldn't be saved. Please try again.",
        variant: "destructive",
      });
    }
  }, [updateProfileMutation, toast]);

  // Save profile to database only (database is single source of truth)
  const saveProfile = useCallback((profile: UserProfile) => {
    if (user?.id) {
      saveProfileToDb(profile);
    }
  }, [user?.id, saveProfileToDb]);

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

  const handleLogout = async () => {
    try {
      console.log('Logging out with Google/Firebase authentication');
      
      // Use Firebase authentication to sign out
      const { FirebaseAuthService } = await import('@/lib/firebase');
      await FirebaseAuthService.signOut();
      
      console.log('Firebase logout successful - redirecting to home');
      
      // Clear any cached data and redirect
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if logout fails
      window.location.href = '/';
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
      setShowPlanningChoice(true);
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

  const renderPlanningChoice = () => (
    <div className="w-full max-w-md mx-auto p-4 space-y-6">
      <div className="text-center pt-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">What are we cooking today?</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Slop Bowl card */}
        <Card
          className="slop-bowl-card relative cursor-pointer transition-all duration-200 -rotate-1 hover:rotate-0 hover:shadow-lg border-2 border-[#FF6B6B]/25 hover:border-[#FF6B6B]/60 bg-gradient-to-br from-orange-50 via-amber-50 to-rose-50"
          onClick={() => {
            setShowPlanningChoice(false);
            setCurrentPhase('slop-bowl');
          }}
        >
          {/* Sticker badge - counter-rotated for handmade feel. Tagline rolls random per visit. */}
          <div className="absolute -top-2 -right-2 z-10 rotate-6 pointer-events-none">
            <span className="bg-[#FF6B6B] text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-md tracking-wider uppercase whitespace-nowrap">
              {slopBowlStickerTagline}
            </span>
          </div>

          <CardContent className="p-4 pt-5 flex flex-col items-center text-center h-full relative">
            {/* Scattered pantry emojis at low opacity */}
            <span className="absolute top-2 left-2 text-xs opacity-20 select-none pointer-events-none">🧀</span>
            <span className="absolute top-14 right-3 text-sm opacity-20 select-none pointer-events-none">🍝</span>
            <span className="absolute bottom-20 left-3 text-xs opacity-20 select-none pointer-events-none">🌶️</span>
            <span className="absolute bottom-24 right-2 text-xs opacity-15 select-none pointer-events-none">🥫</span>

            {/* Icon with ingredients falling into the bowl */}
            <div className="h-14 flex items-center justify-center">
              <div className="relative">
                <span className="slop-ingredient text-sm left-[22%]" aria-hidden="true">🍖</span>
                <span className="slop-ingredient slop-ingredient-d1 text-sm left-[42%]" aria-hidden="true">🥦</span>
                <span className="slop-ingredient slop-ingredient-d2 text-sm left-[58%]" aria-hidden="true">🍚</span>
                <span className="slop-ingredient slop-ingredient-d3 text-sm left-[76%]" aria-hidden="true">🍅</span>
                <span className="slop-emoji text-5xl leading-none inline-block select-none" role="img" aria-label="slop bowl">🥣</span>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-center relative my-3">
              <h3 className="font-bold text-lg text-gray-900">Slop Bowl</h3>
              <p className="text-xs text-gray-700 mt-1 font-medium italic">
                Zero decisions. Laica will plan for you.
              </p>
            </div>
            <Button
              size="sm"
              className="w-full bg-[#FF6B6B] hover:bg-[#FF5252] text-white relative z-10"
            >
              Let's go
            </Button>
          </CardContent>
        </Card>

        {/* Manual planning card */}
        <Card
          className="cursor-pointer hover:shadow-md transition-all border-2 border-transparent hover:border-gray-300"
          onClick={() => setShowPlanningChoice(false)}
        >
          <CardContent className="p-4 pt-5 flex flex-col items-center text-center h-full">
            <div className="h-14 flex items-center justify-center gap-1">
              <span className="text-4xl leading-none select-none" role="img" aria-label="chef">👨‍🍳</span>
              <span className="text-4xl leading-none select-none" role="img" aria-label="chef">👩‍🍳</span>
            </div>
            <div className="flex-1 flex flex-col justify-center my-3">
              <h3 className="font-bold text-lg text-gray-900">Chef it up!</h3>
              <p className="text-xs text-gray-500 mt-1">
                Choose your cuisine, time, and pick from suggestions.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-full"
            >
              Start
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

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
            onClick={() => {
              if (currentPhase !== 'profiling') {
                setShowPlanningChoice(true);
                setCurrentPhase('planning');
              }
            }}
            className={`flex flex-col items-center ${currentPhase === 'planning' || currentPhase === 'slop-bowl' ? 'text-[#FF6B6B]' : 'text-gray-500'}`}
            disabled={userProfile.cookingSkill === ''}
          >
            <ChefHat className="h-5 w-5 mb-1" />
            <span className="text-xs">Cook</span>
          </Button>


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
        <div className="flex items-center justify-center mx-auto mb-6">
          <img src={laicaLogo} alt="Laica" className="h-16" />
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
            {showPlanningChoice ? (
              renderPlanningChoice()
            ) : (
              <MealPlanning
                userProfile={userProfile}
                onMealSelected={handleMealSelected}
                onBackToProfile={() => {
                  // Back from step 1 of manual planning returns to the
                  // Slop Bowl vs Chef it up choice screen, not the profile.
                  setShowPlanningChoice(true);
                }}
              />
            )}
          </div>
        );

      case 'slop-bowl':
        return (
          <div className="pb-20">
            <SlopBowl
              userProfile={userProfile}
              onMealSelected={handleMealSelected}
              onBackToPlanning={() => {
                setShowPlanningChoice(true);
                setCurrentPhase('planning');
              }}
              onEditPantry={() => setCurrentPhase('settings')}
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
        <div className="flex items-center">
          <img src={laicaLogo} alt="Laica" className="h-8" />
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Feedback Button */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsFeedbackOpen(true)}
            className="text-[#FF6B6B] border-[#FF6B6B] bg-transparent hover:bg-[#FF6B6B]/10 text-xs rounded-lg px-2 py-0.5 h-6"
          >
            Feedback
          </Button>
          
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
      
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        currentPage={`/app-${currentPhase}`}
      />
    </div>
  );
}