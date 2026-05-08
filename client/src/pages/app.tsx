import { type ReactNode, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth, useUserProfile, useUpdateUserProfile } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import UserProfiling from '@/components/cooking/user-profiling';
import MealPlanning from '@/components/cooking/meal-planning';
import SlopBowl from '@/components/cooking/slop-bowl';
import LiveCooking from '@/components/cooking/live-cooking';
import UserSettings, { type SettingsSection } from '@/components/cooking/user-settings';
import CookingHistory from '@/components/cooking/cooking-history';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { FeedbackModal } from '@/components/feedback/feedback-modal';
import { ArrowRight, ChefHat, History, LogOut, Menu, MessageCircle, Settings, UserCircle } from 'lucide-react';
import {
  DEFAULT_PLANNING_TIME_VALUE,
  PLANNING_TIME_STORAGE_KEY,
  normalizePlanningTimeValue,
  type PlanningTimeValue,
} from '@shared/planning';
import { mergeUniqueEntries } from '@/lib/entryParsing';
import { hasAnySavedProfileSignal, hasCompletedCookingProfile } from '@/lib/profileReadiness';
import { OPEN_FEEDBACK_EVENT } from '@/lib/rateLimitHandler';

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

type WorkflowPhase = 'profiling' | 'planning' | 'cooking' | 'settings' | 'history' | 'slop-bowl';

const normalizeDietaryRestrictions = (restrictions: string[] | null | undefined) =>
  (restrictions || []).map((restriction) => restriction === 'None' ? 'No restrictions' : restriction);

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
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
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
  const [settingsSection, setSettingsSection] = useState<SettingsSection>('hub');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [lastPlanningTime, setLastPlanningTime] = useState<PlanningTimeValue>(() => {
    if (typeof window === 'undefined') return DEFAULT_PLANNING_TIME_VALUE;
    return normalizePlanningTimeValue(window.localStorage.getItem(PLANNING_TIME_STORAGE_KEY));
  });

  // Picks a fresh random chef emoji (man or woman, yellow tone) each time
  // the planning-choice screen is shown.
  const chefEmoji = useMemo(
    () => CHEF_EMOJIS[Math.floor(Math.random() * CHEF_EMOJIS.length)],
    [showPlanningChoice]
  );
  const hasExistingProfile = hasAnySavedProfileSignal(userProfile);
  const feedbackCurrentPage = useMemo(() => {
    if (currentPhase === 'settings') return `/app-settings-${settingsSection}`;
    if (currentPhase === 'planning') return showPlanningChoice ? '/app-planning-choice' : '/app-planning-manual';
    if (currentPhase === 'profiling') return hasExistingProfile ? '/app-returning-setup' : '/app-first-time-setup';
    return `/app-${currentPhase}`;
  }, [currentPhase, hasExistingProfile, settingsSection, showPlanningChoice]);

  useEffect(() => {
    const openFeedback = () => setIsFeedbackOpen(true);
    window.addEventListener(OPEN_FEEDBACK_EVENT, openFeedback);
    return () => window.removeEventListener(OPEN_FEEDBACK_EVENT, openFeedback);
  }, []);

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
        const isProfileComplete = hasCompletedCookingProfile(profileFromDb);

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
        title: "Changes did not save",
        description: "I couldn't save your changes. Try again.",
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
            onClick={() => {
              setSettingsSection('hub');
              setCurrentPhase('settings');
            }}
            className="underline text-primary hover:text-primary/80"
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

  const handlePlanningTimeChange = useCallback((value: PlanningTimeValue) => {
    setLastPlanningTime(value);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(PLANNING_TIME_STORAGE_KEY, value);
    }
  }, []);

  const handlePlanningPantryIngredientsAdded = useCallback(async (ingredients: string[]) => {
    if (ingredients.length === 0) return true;

    const updatedProfile = {
      ...userProfile,
      pantryIngredients: mergeUniqueEntries(userProfile.pantryIngredients, ingredients),
    };

    setUserProfile(updatedProfile);

    try {
      await updateProfileMutation.mutateAsync({
        cookingSkill: updatedProfile.cookingSkill || undefined,
        dietaryRestrictions: updatedProfile.dietaryRestrictions,
        pantryIngredients: updatedProfile.pantryIngredients,
        kitchenEquipment: updatedProfile.kitchenEquipment,
        favoriteChefs: updatedProfile.favoriteChefs,
      });
      return true;
    } catch (error) {
      console.error('Error saving planning pantry staples:', error);
      setUserProfile(userProfile);
      return false;
    }
  }, [updateProfileMutation, userProfile]);

  const handleBackToPlanning = () => {
    // Check if profile is complete before allowing access to planning
    const isProfileComplete = hasCompletedCookingProfile(userProfile);

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
    const isProfileComplete = hasCompletedCookingProfile(updatedProfile);
    
    if (isProfileComplete) {
      // Show confirmation toast with link to settings
      toast({
        title: "Profile Updated Successfully",
        description: (
          <div>
            Your cooking profile has been updated. Ready to find your perfect meal?{' '}
            <button 
              onClick={() => {
                setSettingsSection('hub');
                setCurrentPhase('settings');
              }}
              className="underline text-primary hover:text-primary/80"
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

  const getUserDisplayName = () => {
    if (!user) return 'Account';

    if ('firstName' in user && 'lastName' in user && user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }

    if ('username' in user && user.username) {
      return user.username;
    }

    return user.email || 'Account';
  };

  const handleLogout = async () => {
    try {
      const { FirebaseAuthService } = await import('@/lib/firebase');
      await FirebaseAuthService.signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/';
    }
  };

  const openSettings = (section: SettingsSection = 'hub') => {
    setSettingsSection(section);
    setCurrentPhase('settings');
    setIsMenuOpen(false);
  };

  const openHistory = () => {
    setCurrentPhase('history');
    setIsMenuOpen(false);
  };

  const renderAppMenu = (
    trigger: ReactNode,
    options: { allowSettings?: boolean; allowHistory?: boolean } = {},
  ) => {
    const { allowSettings = true, allowHistory = allowSettings } = options;

    return (
      <Drawer open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent className="menu-sheet px-4 pb-6 pt-2">
          <DrawerHeader className="px-0 text-left">
            <DrawerTitle className="menu-sheet-title text-3xl">Menu</DrawerTitle>
            <DrawerDescription className="text-sm font-bold text-[hsl(var(--returning-ink)/0.62)]">
              {getUserDisplayName()} · {user?.email || 'Signed in'}
            </DrawerDescription>
          </DrawerHeader>

          <div className="space-y-3">
            <button
              type="button"
              className="menu-destination"
              disabled={!allowSettings}
              onClick={() => {
                if (allowSettings) openSettings('hub');
              }}
            >
              <span className="menu-destination-icon">
                <Settings className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-extrabold">Settings</span>
                <span className="block text-xs font-bold text-[hsl(var(--returning-ink)/0.58)]">Pantry, kitchen, and cooking profile</span>
              </span>
            </button>

            <button
              type="button"
              className="menu-destination"
              disabled={!allowHistory}
              onClick={() => {
                if (allowHistory) openHistory();
              }}
            >
              <span className="menu-destination-icon">
                <History className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-extrabold">History</span>
                <span className="block text-xs font-bold text-[hsl(var(--returning-ink)/0.58)]">Meals you cooked</span>
              </span>
            </button>

            <button
              type="button"
              className="menu-destination"
              onClick={() => {
                setIsMenuOpen(false);
                setIsFeedbackOpen(true);
              }}
            >
              <span className="menu-destination-icon">
                <MessageCircle className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-extrabold">Feedback</span>
                <span className="block text-xs font-bold text-[hsl(var(--returning-ink)/0.58)]">Send a note from this screen</span>
              </span>
            </button>

            <button
              type="button"
              className="menu-destination"
              onClick={handleLogout}
            >
              <span className="menu-destination-icon">
                <UserCircle className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-extrabold">Account</span>
                <span className="block text-xs font-bold text-[hsl(var(--returning-ink)/0.58)]">Sign out</span>
              </span>
              <LogOut className="h-4 w-4 text-[hsl(var(--returning-ink)/0.44)]" />
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    );
  };

  const renderSetupMenu = () => (
    renderAppMenu(
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="setup-menu-button h-10 w-10"
        aria-label="Open account menu"
      >
        <Menu className="h-5 w-5" />
      </Button>,
      { allowSettings: hasExistingProfile, allowHistory: hasExistingProfile },
    )
  );

  const renderPlanningChoice = () => (
    <div className="planning-choice-shell mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-md flex-col px-4 pb-4 pt-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="planning-display text-3xl font-extrabold leading-tight">
            What are we cooking today?
          </h2>
        </div>
      </div>

      <div className="space-y-4">
        {/* design:tone-override — Phase 3 makes Chef It Up the tone-forward primary planning object from the mockup. */}
        <button
          type="button"
          className="planning-choice-card planning-choice-primary"
          onClick={() => setShowPlanningChoice(false)}
        >
          <span className="planning-chef-mark" aria-hidden="true">{chefEmoji}</span>
          <span className="min-w-0 flex-1 text-left">
            <span className="planning-choice-title">Chef It Up</span>
            <span className="planning-choice-copy">
              We&apos;ll shape dinner from what you have.
            </span>
          </span>
          <span className="planning-choice-arrow" aria-hidden="true">
            <ArrowRight className="h-6 w-6" />
          </span>
        </button>

        {/* design:tone-override — Slop Bowl stays intentionally scrappy but secondary in the Phase 3 hierarchy. */}
        <button
          type="button"
          className="planning-choice-card planning-choice-secondary slop-bowl-card"
          onClick={() => {
            setShowPlanningChoice(false);
            setCurrentPhase('slop-bowl');
          }}
        >
          <span className="planning-slop-mark" aria-hidden="true">
            <span className="slop-splash slop-splash-a" />
            <span className="slop-splash slop-splash-b" />
            <span className="slop-scribble">???</span>
            <span className="slop-ingredient left-[16%] text-sm">🥦</span>
            <span className="slop-ingredient slop-ingredient-d1 left-[33%] text-sm">🧅</span>
            <span className="slop-ingredient slop-ingredient-d2 left-[52%] text-sm">🍚</span>
            <span className="slop-ingredient slop-ingredient-d3 left-[70%] text-sm">🧀</span>
            <span className="slop-ingredient slop-ingredient-d4 left-[82%] text-sm">🧂</span>
            <span className="slop-spoon">🥄</span>
            <span className="slop-emoji text-5xl leading-none">🥣</span>
          </span>
          <span className="min-w-0 flex-1 text-left">
            <span className="planning-choice-title">Slop Bowl</span>
            <span className="planning-choice-copy">
              Randomly make me something from the chaos.
            </span>
          </span>
          <span className="planning-choice-arrow planning-choice-arrow-secondary" aria-hidden="true">
            <ArrowRight className="h-5 w-5" />
          </span>
        </button>
      </div>
    </div>
  );

  const renderBottomNav = () => {
    if (currentPhase === 'cooking' || currentPhase === 'profiling') return null;

    return (
      <div className="app-bottom-nav fixed bottom-0 left-0 right-0 p-4">
        <div className="mx-auto flex max-w-xs items-center justify-around">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => {
              setShowPlanningChoice(true);
              setCurrentPhase('planning');
            }}
            className="app-bottom-button"
            disabled={userProfile.cookingSkill === ''}
            aria-label="Cook"
            title="Cook"
          >
            <ChefHat className="h-6 w-6" aria-hidden="true" />
          </Button>

          {renderAppMenu(
            <Button
              variant="ghost"
              size="icon"
              className="app-bottom-button"
              disabled={userProfile.cookingSkill === ''}
              aria-label="Menu"
              title="Menu"
            >
              <Menu className="h-6 w-6" aria-hidden="true" />
            </Button>,
          )}
        </div>
      </div>
    );
  };

  if (isLoadingProfile) {
    return (
      <div className="w-full max-w-2xl mx-auto p-4 md:p-6 min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
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
              menuSlot={renderSetupMenu()}
            />
          </div>
        );
        
      case 'planning':
        return (
          <div className="planning-ui min-h-screen pb-20">
            {showPlanningChoice ? (
              renderPlanningChoice()
            ) : (
              <MealPlanning
                userProfile={userProfile}
                onMealSelected={handleMealSelected}
                initialTimeAvailable={lastPlanningTime}
                onPlanningTimeChange={handlePlanningTimeChange}
                onPantryIngredientsAdded={handlePlanningPantryIngredientsAdded}
                onEditPantry={() => openSettings('pantry')}
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
          <div className="planning-ui min-h-screen pb-20">
            <SlopBowl
              userProfile={userProfile}
              planningTimeAvailable={lastPlanningTime}
              onMealSelected={handleMealSelected}
              onBackToPlanning={() => {
                setShowPlanningChoice(true);
                setCurrentPhase('planning');
              }}
              onEditPantry={() => openSettings('pantry')}
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
              initialSection={settingsSection}
            />
          </div>
        );

      case 'history':
        return (
          <div className="pb-20">
            <CookingHistory onBackToPlanning={handleBackToPlanning} />
          </div>
        );
        
      default:
        return (
          <UserProfiling
            onProfileComplete={handleProfileComplete}
            existingProfile={hasExistingProfile ? userProfile : undefined}
            menuSlot={renderSetupMenu()}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {renderCurrentPhase()}
      {renderBottomNav()}
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        currentPage={feedbackCurrentPage}
      />
    </div>
  );
}
