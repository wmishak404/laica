import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth, useUserProfile, useUpdateUserProfile } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import UserProfiling from '@/components/cooking/user-profiling';
import MealPlanning from '@/components/cooking/meal-planning';
import SlopBowl from '@/components/cooking/slop-bowl';
import LiveCooking from '@/components/cooking/live-cooking';
import UserSettings from '@/components/cooking/user-settings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, ChefHat } from 'lucide-react';

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
  // Slop Bowl additions (all optional — manual flow leaves them undefined)
  isFusion?: boolean;
  ingredients?: string[];      // actual pantry items used — fed to cooking steps
  equipment?: string[];        // user's kitchen equipment — fed to cooking steps
  overview?: string;           // short tagline from slop-bowl response
}

type WorkflowPhase = 'profiling' | 'planning' | 'cooking' | 'settings' | 'slop-bowl';

const hasPlanningProfile = (profile: UserProfile) =>
  Boolean(
    profile.cookingSkill &&
    profile.pantryIngredients.length > 0
  );

const normalizeDietaryRestrictions = (restrictions: string[] | null | undefined) =>
  (restrictions || []).map((restriction) => restriction === 'None' ? 'No restrictions' : restriction);

const SLOP_BOWL_STICKER_TAGLINES = [
  'MAKE GOOD SLOP',
  'LESS BRAIN POWER',
  'NO RULES',
  'FLAVOR ROULETTE',
];

// Chef emoji roster — man and woman cook at the default yellow tone
// (race-neutral). A fresh one is picked each time the planning-choice
// screen is shown so the card alternates representation.
const CHEF_EMOJIS = ['👨‍🍳', '👩‍🍳'];

export default function MobileApp() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: dbProfile, isLoading: isLoadingDbProfile } = useUserProfile();
  const updateProfileMutation = useUpdateUserProfile();
  const [currentPhase, setCurrentPhase] = useState<WorkflowPhase>('profiling');
  const [userProfile, setUserProfile] = useState<UserProfile>({
    cookingSkill: '',
    dietaryRestrictions: [],
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

  // Picks a fresh random chef emoji (man or woman, yellow tone) each time
  // the planning-choice screen is shown.
  const chefEmoji = useMemo(
    () => CHEF_EMOJIS[Math.floor(Math.random() * CHEF_EMOJIS.length)],
    [showPlanningChoice]
  );
  const hasExistingProfile = hasPlanningProfile(userProfile);

  // Load profile from database - database is the single source of truth
  useEffect(() => {
    if (!user?.id) return;
    
    // Wait for database query to complete
    if (isLoadingDbProfile) return;

    // Database is the source of truth - always use database data
    if (dbProfile?.user) {
      const dbUser = dbProfile.user;
      const profileFromDb: UserProfile = {
        cookingSkill: dbUser.cookingSkill || '',
        dietaryRestrictions: normalizeDietaryRestrictions(dbUser.dietaryRestrictions),
        pantryIngredients: dbUser.pantryIngredients || [],
        kitchenEquipment: dbUser.kitchenEquipment || [],
        favoriteChefs: dbUser.favoriteChefs || []
      };

      console.log(hasLoadedFromDb ? 'Syncing profile from database (source of truth)' : 'Loading profile from database (source of truth)');
      setUserProfile(profileFromDb);
      
      if (!hasLoadedFromDb) {
        setHasLoadedFromDb(true);

        // Check if profile is complete
        const isProfileComplete = hasPlanningProfile(profileFromDb);

        if (isProfileComplete) {
          setShowPlanningChoice(true);
          setCurrentPhase('planning');
        } else {
          setCurrentPhase('profiling');
        }
      }

      setIsLoadingProfile(false);
      return;
    }

    // No database profile found - start fresh
    if (!hasLoadedFromDb) {
      console.log('No database profile found, starting fresh');
      setHasLoadedFromDb(true);
      setCurrentPhase('profiling');
    }
    setIsLoadingProfile(false);
  }, [user?.id, dbProfile, isLoadingDbProfile, hasLoadedFromDb]);

  // Save profile to database
  const saveProfileToDb = useCallback(async (profile: UserProfile) => {
    try {
      await updateProfileMutation.mutateAsync({
        cookingSkill: profile.cookingSkill || undefined,
        dietaryRestrictions: profile.dietaryRestrictions,
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
            <div className="h-14 flex items-center justify-center">
              <span className="text-5xl leading-none select-none" role="img" aria-label="chef">{chefEmoji}</span>
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
    if (currentPhase === 'cooking' || currentPhase === 'profiling') return null;

    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="flex justify-around items-center max-w-xs mx-auto">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              setShowPlanningChoice(true);
              setCurrentPhase('planning');
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
      case 'profiling':
        return (
          <div>
            <UserProfiling 
              onProfileComplete={handleProfileComplete}
              existingProfile={hasExistingProfile ? userProfile : undefined}
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
        return (
          <UserProfiling
            onProfileComplete={handleProfileComplete}
            existingProfile={hasExistingProfile ? userProfile : undefined}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {renderCurrentPhase()}
      {renderBottomNav()}
    </div>
  );
}
