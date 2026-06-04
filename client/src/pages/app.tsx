import { type ReactNode, useState, useEffect, useCallback, useMemo } from 'react';
import type { AuthCredential } from 'firebase/auth';
import { isGuestUser, useAuth, useUserProfile, useUpdateUserProfile } from '@/hooks/useAuth';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ToastAction } from '@/components/ui/toast';
import { FeedbackModal } from '@/components/feedback/feedback-modal';
import { ArrowRight, CheckCircle, ChefHat, History, LogOut, Menu, MessageCircle, Settings, UserCircle, UserPlus } from 'lucide-react';
import {
  DEFAULT_PLANNING_TIME_VALUE,
  PLANNING_TIME_STORAGE_KEY,
  normalizePlanningTimeValue,
  type PlanningTimeValue,
} from '@shared/planning';
import { mergeUniqueEntries } from '@/lib/entryParsing';
import { hasAnySavedProfileSignal, hasCompletedCookingProfile } from '@/lib/profileReadiness';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { OPEN_FEEDBACK_EVENT } from '@/lib/rateLimitHandler';

interface UserProfile {
  cookingSkill: string;
  dietaryRestrictions: string[];
  pantryIngredients: string[];
  kitchenEquipment: string[];
  favoriteChefs: string[];
}

const createEmptyUserProfile = (): UserProfile => ({
  cookingSkill: '',
  dietaryRestrictions: [],
  pantryIngredients: [],
  kitchenEquipment: [],
  favoriteChefs: []
});

const guestProfileStorageKey = (userId: string) => `laica:guest-profile:${userId}`;

function readGuestProfile(userId: string): UserProfile {
  if (typeof window === 'undefined') return createEmptyUserProfile();

  const rawProfile = window.localStorage.getItem(guestProfileStorageKey(userId));
  if (!rawProfile) return createEmptyUserProfile();

  try {
    const parsed = JSON.parse(rawProfile) as Partial<UserProfile>;
    return {
      cookingSkill: parsed.cookingSkill || '',
      dietaryRestrictions: Array.isArray(parsed.dietaryRestrictions) ? parsed.dietaryRestrictions : [],
      pantryIngredients: Array.isArray(parsed.pantryIngredients) ? parsed.pantryIngredients : [],
      kitchenEquipment: Array.isArray(parsed.kitchenEquipment) ? parsed.kitchenEquipment : [],
      favoriteChefs: Array.isArray(parsed.favoriteChefs) ? parsed.favoriteChefs : [],
    };
  } catch {
    return createEmptyUserProfile();
  }
}

function writeGuestProfile(userId: string, profile: UserProfile) {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(guestProfileStorageKey(userId), JSON.stringify(profile));
}

function clearGuestProfile(userId: string) {
  if (typeof window === 'undefined') return;

  window.localStorage.removeItem(guestProfileStorageKey(userId));
}

function readPlanningTime(storageKey: string): PlanningTimeValue {
  if (typeof window === 'undefined') return DEFAULT_PLANNING_TIME_VALUE;

  window.localStorage.removeItem(PLANNING_TIME_STORAGE_KEY);
  return normalizePlanningTimeValue(window.localStorage.getItem(storageKey));
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

function profileFromLinkedUser(user: Partial<UserProfile> | null | undefined): UserProfile {
  return {
    cookingSkill: user?.cookingSkill || '',
    dietaryRestrictions: normalizeDietaryRestrictions(user?.dietaryRestrictions),
    pantryIngredients: user?.pantryIngredients || [],
    kitchenEquipment: user?.kitchenEquipment || [],
    favoriteChefs: user?.favoriteChefs || [],
  };
}

function profileUpdatePayload(profile: UserProfile) {
  return {
    cookingSkill: profile.cookingSkill || undefined,
    dietaryRestrictions: profile.dietaryRestrictions,
    pantryIngredients: profile.pantryIngredients,
    kitchenEquipment: profile.kitchenEquipment,
    favoriteChefs: profile.favoriteChefs,
  };
}

function mergeDietaryRestrictionsForPromotion(existing: string[], guest: string[]) {
  const normalizedExisting = normalizeDietaryRestrictions(existing);
  const normalizedGuest = normalizeDietaryRestrictions(guest);
  const guestHasSpecificRestriction = normalizedGuest.some((restriction) => restriction !== 'No restrictions');
  const existingHasSpecificRestriction = normalizedExisting.some((restriction) => restriction !== 'No restrictions');

  if (existingHasSpecificRestriction) {
    return mergeUniqueEntries(normalizedExisting, normalizedGuest.filter((restriction) => restriction !== 'No restrictions'));
  }

  if (guestHasSpecificRestriction) {
    return normalizedGuest.filter((restriction) => restriction !== 'No restrictions');
  }

  return mergeUniqueEntries(normalizedExisting, normalizedGuest);
}

export function mergeProfilesForGuestPromotion(existing: UserProfile, guest: UserProfile): UserProfile {
  return {
    cookingSkill: existing.cookingSkill || guest.cookingSkill,
    dietaryRestrictions: mergeDietaryRestrictionsForPromotion(existing.dietaryRestrictions, guest.dietaryRestrictions),
    pantryIngredients: mergeUniqueEntries(existing.pantryIngredients, guest.pantryIngredients),
    kitchenEquipment: mergeUniqueEntries(existing.kitchenEquipment, guest.kitchenEquipment),
    favoriteChefs: mergeUniqueEntries(existing.favoriteChefs, guest.favoriteChefs),
  };
}

interface PendingExistingGoogleImport {
  credential: AuthCredential;
  guestUserId: string;
  guestProfile: UserProfile;
}

type GuestPromotionStatus = 'idle' | 'opening' | 'waiting' | 'saving';

function isPopupCancellationError(error: any) {
  return error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request';
}

function getGuestPromotionLabel(status: GuestPromotionStatus) {
  switch (status) {
    case 'opening':
      return 'Opening Google sign-in...';
    case 'waiting':
      return 'Waiting for Google...';
    case 'saving':
      return 'Saving progress...';
    default:
      return 'Keep your pantry and recipes for next time. Sign up when ready.';
  }
}

// Chef emoji roster — man and woman cook at the default yellow tone
// (race-neutral). A fresh one is picked each time the planning-choice
// screen is shown so the card alternates representation.
const CHEF_EMOJIS = ['👨‍🍳', '👩‍🍳'];
export const SLOP_IT_UP_PLANNING_COPY_OPTIONS = [
  "We'll turn your ingredients into a Slop Bowl.",
  'Fridge chaos, Slop Bowl incoming.',
  "We'll make a Slop Bowl from whatever's around.",
  'Let us cook up a Slop Bowl from the chaos.',
] as const;
export const EMPTY_PANTRY_RECIPE_COPY = 'Add or scan pantry items before I can suggest recipes.';
export const EMPTY_PANTRY_CHEF_IT_UP_COPY = 'Your pantry is empty. Please add or scan more items.';

export function getRandomSlopItUpPlanningCopy(random = Math.random) {
  const randomIndex = Math.floor(random() * SLOP_IT_UP_PLANNING_COPY_OPTIONS.length);
  return SLOP_IT_UP_PLANNING_COPY_OPTIONS[randomIndex] ?? SLOP_IT_UP_PLANNING_COPY_OPTIONS[0];
}

export function getPlanningPantryCountLabel(pantryItemCount: number) {
  return `${pantryItemCount} pantry item${pantryItemCount === 1 ? '' : 's'}`;
}

export function getPlanningPantryStatusCopy(pantryItemCount: number) {
  if (pantryItemCount <= 0) {
    return EMPTY_PANTRY_CHEF_IT_UP_COPY;
  }

  return `Right now I see ${getPlanningPantryCountLabel(pantryItemCount)} we can work with.`;
}

export default function MobileApp() {
  const { user } = useAuth();
  const isGuest = isGuestUser(user);
  const { toast } = useToast();
  const { data: dbProfile, isLoading: isLoadingDbProfile } = useUserProfile();
  const updateProfileMutation = useUpdateUserProfile();
  const [currentPhase, setCurrentPhase] = useState<WorkflowPhase>('profiling');
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    ...createEmptyUserProfile()
  });
  const [selectedMeal, setSelectedMeal] = useState<RecipeRecommendation | null>(null);
  const [scheduledTime, setScheduledTime] = useState<string>('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [hasLoadedFromDb, setHasLoadedFromDb] = useState(false);
  const [showPlanningChoice, setShowPlanningChoice] = useState(true);
  const [settingsSection, setSettingsSection] = useState<SettingsSection>('hub');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [guestPromotionStatus, setGuestPromotionStatus] = useState<GuestPromotionStatus>('idle');
  const [guestPromotionConfirmation, setGuestPromotionConfirmation] = useState<string | null>(null);
  const [pendingExistingGoogleImport, setPendingExistingGoogleImport] = useState<PendingExistingGoogleImport | null>(null);
  const [slopItUpPlanningCopy] = useState(() => getRandomSlopItUpPlanningCopy());
  const planningStateScopeKey = useMemo(
    () => user?.id ? `${isGuest ? 'guest' : 'linked'}:${user.id}` : 'signed-out',
    [isGuest, user?.id],
  );
  const planningTimeStorageKey = `${PLANNING_TIME_STORAGE_KEY}:${planningStateScopeKey}`;
  const [lastPlanningTime, setLastPlanningTime] = useState<PlanningTimeValue>(() =>
    readPlanningTime(planningTimeStorageKey)
  );

  // Picks a fresh random chef emoji (man or woman, yellow tone) each time
  // the planning-choice screen is shown.
  const chefEmoji = useMemo(
    () => CHEF_EMOJIS[Math.floor(Math.random() * CHEF_EMOJIS.length)],
    [showPlanningChoice]
  );
  const hasExistingProfile = hasAnySavedProfileSignal(userProfile);
  const isPromotingGuest = guestPromotionStatus !== 'idle';
  const guestPromotionLabel = getGuestPromotionLabel(guestPromotionStatus);
  const pantryItemCount = userProfile.pantryIngredients.length;
  const hasPantryItems = pantryItemCount > 0;
  const planningPantryCountLabel = getPlanningPantryCountLabel(pantryItemCount);
  const planningPantryStatusCopy = getPlanningPantryStatusCopy(pantryItemCount);
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

  useEffect(() => {
    setLastPlanningTime(readPlanningTime(planningTimeStorageKey));
  }, [planningTimeStorageKey]);

  useEffect(() => {
    if (!user?.id) return;

    setHasLoadedFromDb(false);
    setIsLoadingProfile(true);
    setUserProfile(createEmptyUserProfile());
    setSelectedMeal(null);
    setScheduledTime('');
    setShowPlanningChoice(true);
    setCurrentPhase('profiling');
  }, [planningStateScopeKey, user?.id]);

  // Load profile from database - database is the single source of truth
  useEffect(() => {
    if (!user?.id) return;

    if (isGuest) {
      const profileFromBrowser = readGuestProfile(user.id);
      setUserProfile(profileFromBrowser);

      if (!hasLoadedFromDb) {
        setHasLoadedFromDb(true);
        setCurrentPhase(hasCompletedCookingProfile(profileFromBrowser) ? 'planning' : 'profiling');
      }

      setIsLoadingProfile(false);
      return;
    }
    
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
  }, [user?.id, isGuest, dbProfile, isLoadingDbProfile, hasLoadedFromDb]);

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
    if (user?.id && isGuest) {
      writeGuestProfile(user.id, profile);
      return;
    }

    if (user?.id) {
      saveProfileToDb(profile);
    }
  }, [isGuest, user?.id, saveProfileToDb]);

  const importGuestProfileToLinkedAccount = useCallback(async (
    guestProfile: UserProfile,
    guestUserId: string,
  ) => {
    const linkedProfileResponse = await apiRequest('GET', '/api/user/profile');
    const linkedProfile = await linkedProfileResponse.json();
    const existingProfile = profileFromLinkedUser(linkedProfile?.user);
    const mergedProfile = mergeProfilesForGuestPromotion(existingProfile, guestProfile);

    await updateProfileMutation.mutateAsync(profileUpdatePayload(mergedProfile));
    clearGuestProfile(guestUserId);
    setUserProfile(mergedProfile);
    setHasLoadedFromDb(true);
    queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
    queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });

    return mergedProfile;
  }, [updateProfileMutation]);

  const finishGuestPromotion = useCallback(async (guestProfile: UserProfile, guestUserId: string) => {
    const authResponse = await apiRequest('POST', '/api/auth/google');
    const linkedUser = await authResponse.json();
    queryClient.setQueryData(["/api/auth/session"], linkedUser);
    queryClient.setQueryData(["/api/auth/user"], linkedUser);

    const importedProfile = hasAnySavedProfileSignal(guestProfile)
      ? await importGuestProfileToLinkedAccount(guestProfile, guestUserId)
      : null;
    const profileToUse = importedProfile ?? createEmptyUserProfile();

    setIsMenuOpen(false);
    setShowPlanningChoice(true);
    setCurrentPhase(hasCompletedCookingProfile(profileToUse) ? 'planning' : 'profiling');
    setGuestPromotionConfirmation('Account successfully connected and signed in. Your kitchen is saved.');

    toast({
      title: importedProfile ? 'Progress saved' : 'Account ready',
      description: importedProfile
        ? 'Your pantry, tools, and cooking profile are saved to your Google account.'
        : 'You are signed in with Google.',
    });
  }, [importGuestProfileToLinkedAccount, toast]);

  const handleGuestSignUp = useCallback(async () => {
    if (!isGuest || !user?.id || isPromotingGuest) return;

    const guestUserId = user.id;
    const guestProfile = userProfile;
    let waitingTimer: number | undefined;

    try {
      setGuestPromotionStatus('opening');
      waitingTimer = window.setTimeout(() => {
        setGuestPromotionStatus((currentStatus) => currentStatus === 'opening' ? 'waiting' : currentStatus);
      }, 800);

      const { FirebaseAuthService } = await import('@/lib/firebase');
      await FirebaseAuthService.linkCurrentGuestWithGooglePopup();
      setGuestPromotionStatus('saving');
      await finishGuestPromotion(guestProfile, guestUserId);
    } catch (error: any) {
      const { FirebaseAuthService } = await import('@/lib/firebase');
      const credential = error?.code === 'auth/credential-already-in-use'
        ? FirebaseAuthService.getGoogleCredentialFromError(error)
        : null;

      if (credential) {
        setPendingExistingGoogleImport({ credential, guestUserId, guestProfile });
        return;
      }

      if (isPopupCancellationError(error)) {
        toast({
          title: 'Sign-up canceled',
          description: 'Nothing changed. Your pantry is still here when you are ready.',
          duration: 2500,
        });
        return;
      }

      console.error('Guest sign-up failed:', error);
      toast({
        title: 'Sign-up did not work',
        description: error?.message || "I couldn't create your account. Try again.",
        variant: 'destructive',
      });
    } finally {
      if (waitingTimer !== undefined) {
        window.clearTimeout(waitingTimer);
      }
      setGuestPromotionStatus('idle');
    }
  }, [finishGuestPromotion, isGuest, isPromotingGuest, toast, user?.id, userProfile]);

  const confirmExistingGoogleImport = useCallback(async () => {
    if (!pendingExistingGoogleImport || isPromotingGuest) return;

    try {
      setGuestPromotionStatus('saving');
      const { FirebaseAuthService } = await import('@/lib/firebase');
      await FirebaseAuthService.signInWithGoogleCredential(pendingExistingGoogleImport.credential);
      await finishGuestPromotion(
        pendingExistingGoogleImport.guestProfile,
        pendingExistingGoogleImport.guestUserId,
      );
      setPendingExistingGoogleImport(null);
    } catch (error: any) {
      console.error('Existing Google import failed:', error);
      toast({
        title: 'Import did not work',
        description: "I couldn't add this browser's setup to that account. Try again.",
        variant: 'destructive',
      });
    } finally {
      setGuestPromotionStatus('idle');
    }
  }, [finishGuestPromotion, isPromotingGuest, pendingExistingGoogleImport, toast]);

  const handleProfileComplete = (profile: UserProfile) => {
    setUserProfile(profile);
    saveProfile(profile);
    
    if (isGuest) {
      toast({
        title: "Your kitchen is ready",
        description: "I'll remember this while you try Laica.",
        duration: 5000,
      });
    } else {
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
    }
    
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
      window.localStorage.setItem(planningTimeStorageKey, value);
    }
  }, [planningTimeStorageKey]);

  const handlePlanningPantryIngredientsAdded = useCallback(async (ingredients: string[]) => {
    if (ingredients.length === 0) return true;

    const updatedProfile = {
      ...userProfile,
      pantryIngredients: mergeUniqueEntries(userProfile.pantryIngredients, ingredients),
    };

    setUserProfile(updatedProfile);

    if (user?.id && isGuest) {
      writeGuestProfile(user.id, updatedProfile);
      return true;
    }

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
  }, [isGuest, updateProfileMutation, user?.id, userProfile]);

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

  const handleSettingsProfileUpdate = useCallback((updatedProfile: UserProfile) => {
    setUserProfile(updatedProfile);
    saveProfile(updatedProfile);
  }, [saveProfile]);

  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    setUserProfile(updatedProfile);
    saveProfile(updatedProfile);
    
    // Check if profile is complete before going to planning
    const isProfileComplete = hasCompletedCookingProfile(updatedProfile);
    
    if (isProfileComplete) {
      if (isGuest) {
        toast({
          title: "Your kitchen is ready",
          description: "I'll remember this while you try Laica.",
          duration: 5000,
        });
      } else {
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
      }
      
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

    return isGuest ? 'Your kitchen' : user.email || 'Account';
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

  const handleGuestStartOver = async () => {
    if (isGuest && user?.id) {
      clearGuestProfile(user.id);
      window.localStorage.removeItem(planningTimeStorageKey);
    }

    await handleLogout();
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

  const showLinkedAccountToast = (surface: string) => {
    toast({
      title: 'Sign in or create an account to save your ingredients and profile',
      description: `${surface} uses saved ingredients and profile. You can keep cooking with Chef It Up.`,
      variant: 'destructive',
    });
  };

  const showEmptyPantryToast = () => {
    toast({
      title: 'Your pantry is empty',
      description: isGuest
        ? 'Add or scan pantry items in Settings.'
        : EMPTY_PANTRY_RECIPE_COPY,
      action: (
        <ToastAction altText="Open Pantry Settings" onClick={() => openSettings('pantry')}>
          Add pantry
        </ToastAction>
      ),
      variant: 'destructive',
    });
  };

  const handleChefItUpSelect = () => {
    if (!hasPantryItems) {
      showEmptyPantryToast();
      return;
    }

    setShowPlanningChoice(false);
  };

  const handleSlopItUpSelect = () => {
    if (isGuest) {
      showLinkedAccountToast('Slop It Up');
      return;
    }

    setShowPlanningChoice(false);
    setCurrentPhase('slop-bowl');
  };

  const renderAppMenu = (
    trigger: ReactNode,
    options: { allowSettings?: boolean; allowHistory?: boolean } = {},
  ) => {
    const { allowSettings = true, allowHistory = allowSettings } = options;
    const canUseSettings = allowSettings;
    const canUseHistory = allowHistory && !isGuest;

    return (
      <Drawer open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent className="menu-sheet px-4 pb-6 pt-2">
          <DrawerHeader className="px-0 text-left">
            <DrawerTitle className="menu-sheet-title text-3xl">Menu</DrawerTitle>
            <DrawerDescription className="text-sm font-bold text-[hsl(var(--returning-ink)/0.62)]">
              {getUserDisplayName()} · {isGuest ? 'Saved on this browser' : user?.email || 'Signed in'}
            </DrawerDescription>
          </DrawerHeader>

          <div className="space-y-3">
            <button
              type="button"
              className="menu-destination"
              disabled={!canUseSettings}
              onClick={() => {
                if (canUseSettings) openSettings('hub');
              }}
            >
              <span className="menu-destination-icon">
                <Settings className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-extrabold">Settings</span>
                <span className="block text-xs font-bold text-[hsl(var(--returning-ink)/0.58)]">
                  Pantry, kitchen, and cooking profile
                </span>
              </span>
            </button>

            <button
              type="button"
              className="menu-destination"
              disabled={!canUseHistory}
              onClick={() => {
                if (canUseHistory) openHistory();
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

            {isGuest ? (
              <>
                <button
                  type="button"
                  className="menu-destination"
                  disabled={isPromotingGuest}
                  onClick={handleGuestSignUp}
                >
                  <span className="menu-destination-icon">
                    <UserPlus className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-extrabold">Sign up</span>
                    <span className="block text-xs font-bold text-[hsl(var(--returning-ink)/0.58)]">
                      {isPromotingGuest ? guestPromotionLabel : 'Save your pantry and profile'}
                    </span>
                  </span>
                  <UserPlus className="h-4 w-4 text-[hsl(var(--returning-ink)/0.44)]" />
                </button>

                <button
                  type="button"
                  className="menu-destination"
                  disabled={isPromotingGuest}
                  onClick={handleGuestStartOver}
                >
                  <span className="menu-destination-icon">
                    <LogOut className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-extrabold">Start over</span>
                    <span className="block text-xs font-bold text-[hsl(var(--returning-ink)/0.58)]">
                      Clear this setup and return home
                    </span>
                  </span>
                  <LogOut className="h-4 w-4 text-[hsl(var(--returning-ink)/0.44)]" />
                </button>
              </>
            ) : (
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
            )}
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
          {/* design:tone-override — Planning status emphasizes only the live pantry fact in coral per Phase 3.1. */}
          <p className="planning-choice-copy max-w-sm">
            {hasPantryItems ? (
              <>
                Right now I see <span className="planning-pantry-status-emphasis">{planningPantryCountLabel}</span> we can work with.
              </>
            ) : (
              <>
                Your pantry is <span className="planning-pantry-status-emphasis">empty</span>. Please add or scan more items.
              </>
            )}
          </p>
          {isGuest && hasExistingProfile && (
            <button
              type="button"
              className="mt-4 inline-flex max-w-sm items-center gap-2 rounded-full border-2 border-primary/20 bg-white/90 px-4 py-2 text-left text-xs font-extrabold text-[hsl(var(--returning-ink))] shadow-sm"
              onClick={handleGuestSignUp}
              disabled={isPromotingGuest}
            >
              <UserPlus className="h-4 w-4 shrink-0 text-primary" />
              <span>{guestPromotionLabel}</span>
            </button>
          )}
          {!isGuest && guestPromotionConfirmation && (
            <div className="mt-4 inline-flex max-w-sm items-center gap-2 rounded-full border-2 border-primary/20 bg-white/90 px-4 py-2 text-left text-xs font-extrabold text-[hsl(var(--returning-ink))] shadow-sm">
              <CheckCircle className="h-4 w-4 shrink-0 text-primary" />
              <span>{guestPromotionConfirmation}</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* design:tone-override — Phase 3 makes Chef It Up the tone-forward primary planning object from the mockup. */}
        <button
          type="button"
          className="planning-choice-card planning-choice-primary"
          onClick={handleChefItUpSelect}
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
          onClick={handleSlopItUpSelect}
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
            <span className="planning-choice-title italic">Slop It Up</span>
            <span className="planning-choice-copy italic">
              {slopItUpPlanningCopy}
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

          {isGuest && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleGuestSignUp}
              className="app-bottom-button"
              disabled={isPromotingGuest}
              aria-label="Save progress"
              title={isPromotingGuest ? guestPromotionLabel : 'Save progress'}
            >
              <UserPlus className="h-6 w-6" aria-hidden="true" />
            </Button>
          )}

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
                key={planningStateScopeKey}
                userProfile={userProfile}
                sessionScopeKey={planningStateScopeKey}
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
              onProfileUpdate={handleSettingsProfileUpdate}
              onBackToPlanning={handleBackToPlanning}
              initialSection={settingsSection}
              persistenceMode={isGuest ? 'session' : 'linked'}
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
      <AlertDialog
        open={Boolean(pendingExistingGoogleImport)}
        onOpenChange={(open) => {
          if (!open && !isPromotingGuest) {
            setPendingExistingGoogleImport(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save this setup to Google?</AlertDialogTitle>
            <AlertDialogDescription>
              We&apos;ll sign in with Google, then add this pantry, tools, and cooking profile.
              If anything is already saved there, Laica won&apos;t overwrite it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPromotingGuest}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                confirmExistingGoogleImport();
              }}
              disabled={isPromotingGuest}
            >
              {isPromotingGuest ? 'Saving...' : 'Continue'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
