import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useResetPantry, useUpdateUserProfile } from '@/hooks/useAuth';

import { InventoryReviewChip } from '@/components/cooking/inventory-review-chip';
import { NativeCamera } from '@/components/ui/native-camera';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { Trash2, Settings, Package, User, Check, ImagePlus, Loader2 } from 'lucide-react';
import { processWithBoundedConcurrency } from '@/lib/boundedConcurrency';
import {
  clearInventoryReviewType,
  createInventoryReviewState,
  getInventoryReviewChipState,
  markInventoryReviewEntries,
  pruneInventoryReviewType,
  removeInventoryReviewEntries,
} from '@/lib/inventoryReviewState';
import {
  correctPantryManualEntries,
  mergeUniqueEntries,
  mergeUniqueEntriesWithMetadata,
  normalizeEntryDuplicateKey,
  normalizeEntryLabel,
  parseCommaSeparatedEntries,
  type PantryManualEntryCorrection,
} from '@/lib/entryParsing';
import { analyzeImage } from '@/lib/openai';
import {
  extractVisionLabels,
  getVisionRejectionFeedback,
  isRejectedVisionResult,
  type VisionAnalysisResult,
  type VisionScanType,
} from '@/lib/visionResult';
import {
  SCAN_ANALYSIS_CONCURRENCY,
  SCAN_UPLOAD_LIMITS,
  scanAreaLabel,
  type InventoryScanType,
} from '@shared/scan-policy';

interface UserProfile {
  cookingSkill: string;
  dietaryRestrictions: string[];
  pantryIngredients: string[];
  kitchenEquipment: string[];
  favoriteChefs: string[];
}

interface UserSettingsProps {
  userProfile: UserProfile;
  onProfileUpdate: (profile: UserProfile) => void;
  onBackToPlanning: () => void;
  initialSection?: SettingsSection;
}

export type SettingsSection = 'hub' | 'pantry' | 'kitchen' | 'profile';
type ScanProgress = { completed: number; total: number } | null;

function isAbortError(error: unknown) {
  if (typeof DOMException !== 'undefined' && error instanceof DOMException && error.name === 'AbortError') {
    return true;
  }

  const message = error instanceof Error ? error.message : String(error);
  return /abort|cancelled|canceled/i.test(message);
}

export default function UserSettings({ userProfile, onProfileUpdate: _onProfileUpdate, onBackToPlanning, initialSection = 'hub' }: UserSettingsProps) {
  const [profile, setProfile] = useState<UserProfile>(userProfile);
  const [activeSection, setActiveSection] = useState<SettingsSection>(initialSection);
  
  // Sync local state with prop changes (e.g., after profile reset)
  useEffect(() => {
    setProfile(userProfile);
  }, [userProfile]);

  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);
  
  // Option arrays matching the initial profiling
  const skillLevels = [
    { value: 'beginner', label: 'Beginner', description: 'I can make basic dishes', illustration: '🥄' },
    { value: 'intermediate', label: 'Intermediate', description: 'I follow recipes easily', illustration: '🍳' },
    { value: 'expert', label: 'Expert', description: 'I riff and modify dishes', illustration: '🔥' }
  ];

  const dietaryOptions = [
    { label: 'No restrictions', illustration: '✅' },
    { label: 'Gluten Free', illustration: '🌾' },
    { label: 'Dairy Free', illustration: '🥛' },
    { label: 'Vegetarian', illustration: '🥗' },
    { label: 'Vegan', illustration: '🌱' },
    { label: 'No Red Meat', illustration: '🍗' },
    { label: 'Halal', illustration: '🍽️' },
    { label: 'Kosher', illustration: '🫓' },
    { label: 'Keto', illustration: '🥑' },
    { label: 'Paleo', illustration: '🥩' },
  ];

  const [manualEntry, setManualEntry] = useState<Record<'pantry' | 'kitchen', string>>({ pantry: '', kitchen: '' });
  const [manualOpen, setManualOpen] = useState<Record<'pantry' | 'kitchen', boolean>>({ pantry: false, kitchen: false });
  const [isAnalyzingPantry, setIsAnalyzingPantry] = useState(false);
  const [isAnalyzingEquipment, setIsAnalyzingEquipment] = useState(false);
  const [scanProgress, setScanProgress] = useState<Record<InventoryScanType, ScanProgress>>({ pantry: null, kitchen: null });
  const [recentlyCorrectedPantryKeys, setRecentlyCorrectedPantryKeys] = useState<Set<string>>(() => new Set());
  const [inventoryReviewState, setInventoryReviewState] = useState(createInventoryReviewState);
  const scanRunIds = useRef<Record<InventoryScanType, number>>({ pantry: 0, kitchen: 0 });
  const scanControllers = useRef<Record<InventoryScanType, AbortController | null>>({ pantry: null, kitchen: null });
  const correctionHighlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toast } = useToast();

  useEffect(() => () => {
    scanControllers.current.pantry?.abort();
    scanControllers.current.kitchen?.abort();
    scanControllers.current.pantry = null;
    scanControllers.current.kitchen = null;
    scanRunIds.current.pantry += 1;
    scanRunIds.current.kitchen += 1;
    if (correctionHighlightTimeoutRef.current) {
      clearTimeout(correctionHighlightTimeoutRef.current);
    }
  }, []);

  const setInventoryAnalyzing = (type: InventoryScanType, value: boolean) => {
    if (type === 'pantry') {
      setIsAnalyzingPantry(value);
    } else {
      setIsAnalyzingEquipment(value);
    }
  };

  const startInventoryScan = (type: InventoryScanType, total = 1) => {
    scanControllers.current[type]?.abort();
    const controller = new AbortController();
    const id = scanRunIds.current[type] + 1;
    scanRunIds.current[type] = id;
    scanControllers.current[type] = controller;
    setInventoryAnalyzing(type, true);
    setScanProgress(prev => ({
      ...prev,
      [type]: total > 1 ? { completed: 0, total } : null,
    }));

    return { id, controller };
  };

  const isActiveInventoryScan = (type: InventoryScanType, id: number, controller: AbortController) =>
    scanRunIds.current[type] === id && scanControllers.current[type] === controller && !controller.signal.aborted;

  const finishInventoryScan = (type: InventoryScanType, id: number, controller: AbortController) => {
    if (scanRunIds.current[type] !== id || scanControllers.current[type] !== controller) {
      return;
    }

    scanControllers.current[type] = null;
    setInventoryAnalyzing(type, false);
    setScanProgress(prev => ({ ...prev, [type]: null }));
  };

  const cancelInventoryScan = (type: InventoryScanType) => {
    scanControllers.current[type]?.abort();
    scanControllers.current[type] = null;
    scanRunIds.current[type] += 1;
    setInventoryAnalyzing(type, false);
    setScanProgress(prev => ({ ...prev, [type]: null }));
  };

  const hasActiveScan = isAnalyzingPantry || isAnalyzingEquipment;

  const updateInventoryItems = (type: InventoryScanType, items: string[]) => {
    setProfile(prev => ({
      ...prev,
      [type === 'pantry' ? 'pantryIngredients' : 'kitchenEquipment']: items,
    }));
    setInventoryReviewState(prev => pruneInventoryReviewType(prev, type, items));
  };

  const markReviewEntries = (type: InventoryScanType, entries: string[], marker: 'recent' | 'found-again') => {
    setInventoryReviewState(prev => markInventoryReviewEntries(prev, type, entries, marker));
  };

  const clearReviewEntries = (type: InventoryScanType) => {
    setInventoryReviewState(prev => clearInventoryReviewType(prev, type));
  };

  const foundAgainCopy = (count: number) =>
    count > 0
      ? ` ${count} saved item${count === 1 ? ' was' : 's were'} found again.`
      : '';

  const flashCorrectedPantryEntries = (entries: string[]) => {
    const keys = entries.map(normalizeEntryDuplicateKey).filter(Boolean);
    if (keys.length === 0) {
      return;
    }

    if (correctionHighlightTimeoutRef.current) {
      clearTimeout(correctionHighlightTimeoutRef.current);
    }

    setRecentlyCorrectedPantryKeys(new Set(keys));
    correctionHighlightTimeoutRef.current = setTimeout(() => {
      setRecentlyCorrectedPantryKeys(new Set());
      correctionHighlightTimeoutRef.current = null;
    }, 2200);
  };

  const showPantryCorrectionToast = (
    originalEntries: string[],
    corrections: PantryManualEntryCorrection[],
    correctedAddedEntries: string[],
  ) => {
    if (corrections.length === 0 || correctedAddedEntries.length === 0) {
      return;
    }

    const correctedAddedKeys = new Set(correctedAddedEntries.map(normalizeEntryDuplicateKey));
    flashCorrectedPantryEntries(correctedAddedEntries);

    toast({
      title: 'Corrected some entries',
      action: (
        <ToastAction
          altText="Undo spelling cleanup"
          onClick={() => {
            setRecentlyCorrectedPantryKeys(new Set());
            setProfile((prev) => {
              const withoutCorrectedBatch = prev.pantryIngredients.filter(
                (entry) => !correctedAddedKeys.has(normalizeEntryDuplicateKey(entry)),
              );

              return {
                ...prev,
                pantryIngredients: mergeUniqueEntries(withoutCorrectedBatch, originalEntries),
              };
            });
            setInventoryReviewState(prev => markInventoryReviewEntries(
              removeInventoryReviewEntries(prev, 'pantry', correctedAddedEntries),
              'pantry',
              originalEntries,
              'recent',
            ));
          }}
        >
          Undo
        </ToastAction>
      ),
    });
  };

  const showScanBlockedToast = (action: string) => {
    toast({
      title: "Scan in progress",
      description: `Wait for the active scan to finish or leave Settings to cancel it before ${action}.`,
    });
  };

  const handleBack = () => {
    if (hasActiveScan) {
      const shouldLeave = window.confirm('Leave Settings and cancel the active scan? Items found so far may not be saved.');
      if (!shouldLeave) {
        return;
      }

      cancelInventoryScan('pantry');
      cancelInventoryScan('kitchen');
    }

    onBackToPlanning();
  };

  // Handler functions matching the initial profiling
  const handleDietaryChange = (restriction: string) => {
    if (restriction === 'No restrictions') {
      setProfile(prev => ({ ...prev, dietaryRestrictions: ['No restrictions'] }));
    } else {
      setProfile(prev => ({
        ...prev,
        dietaryRestrictions: prev.dietaryRestrictions.includes('No restrictions')
          ? [restriction]
          : prev.dietaryRestrictions.includes(restriction)
          ? prev.dietaryRestrictions.filter(r => r !== restriction)
          : [...prev.dietaryRestrictions.filter(r => r !== 'No restrictions'), restriction]
      }));
    }
  };

  const resetPantryMutation = useResetPantry();
  const updateProfileMutation = useUpdateUserProfile();

  const handleResetPantry = async () => {
    if (hasActiveScan) {
      showScanBlockedToast('resetting inventory');
      return;
    }

    if (window.confirm('Are you sure you want to completely reset your pantry? This will remove all current ingredients and cannot be undone.')) {
      try {
        await resetPantryMutation.mutateAsync();
        updateInventoryItems('pantry', []);
        clearReviewEntries('pantry');
        toast({
          title: "Pantry Reset",
          description: "Your pantry has been completely cleared. You can now rescan or add ingredients fresh.",
        });
      } catch (error) {
        toast({
          title: "Pantry did not reset",
          description: "I couldn't reset your pantry. Try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleResetEquipment = async () => {
    if (hasActiveScan) {
      showScanBlockedToast('resetting inventory');
      return;
    }

    if (window.confirm('Are you sure you want to reset your equipment list? This will remove all current equipment.')) {
      try {
        await updateProfileMutation.mutateAsync({ 
          kitchenEquipment: [] 
        });
        updateInventoryItems('kitchen', []);
        clearReviewEntries('kitchen');
        toast({
          title: "Equipment Reset",
          description: "Your equipment list has been cleared.",
        });
      } catch (error) {
        toast({
          title: "Equipment did not reset",
          description: "I couldn't reset your equipment. Try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSavePantry = async () => {
    if (hasActiveScan) {
      showScanBlockedToast('saving inventory changes');
      return;
    }

    try {
      // Save only pantry ingredients without navigating away
      await updateProfileMutation.mutateAsync({ 
        pantryIngredients: profile.pantryIngredients 
      });
      clearReviewEntries('pantry');
      toast({
        title: "Pantry saved!",
        description: "Your pantry ingredients have been updated successfully."
      });
    } catch (error) {
      toast({
        title: "Pantry did not save",
        description: "I couldn't save your pantry. Try again.",
        variant: "destructive"
      });
    }
  };

  const handleSaveEquipment = async () => {
    if (hasActiveScan) {
      showScanBlockedToast('saving inventory changes');
      return;
    }

    try {
      // Save only kitchen equipment without navigating away
      await updateProfileMutation.mutateAsync({ 
        kitchenEquipment: profile.kitchenEquipment 
      });
      clearReviewEntries('kitchen');
      toast({
        title: "Equipment saved!",
        description: "Your kitchen equipment has been updated successfully."
      });
    } catch (error) {
      toast({
        title: "Equipment did not save",
        description: "I couldn't save your equipment. Try again.",
        variant: "destructive"
      });
    }
  };

  const handleSaveProfile = async () => {
    try {
      // Save only profile settings without navigating away
      await updateProfileMutation.mutateAsync({ 
        cookingSkill: profile.cookingSkill,
        dietaryRestrictions: profile.dietaryRestrictions
      });
      toast({
        title: "Profile saved!",
        description: "Your cooking profile has been updated successfully."
      });
    } catch (error) {
      toast({
        title: "Profile did not save",
        description: "I couldn't save your profile. Try again.",
        variant: "destructive"
      });
    }
  };

  const handlePantryImageCapture = async (imageData: string) => {
    if (hasActiveScan) {
      showScanBlockedToast('starting another scan');
      return;
    }

    await handlePantryImageAnalysis(imageData);
  };

  const handleEquipmentImageCapture = async (imageData: string) => {
    if (hasActiveScan) {
      showScanBlockedToast('starting another scan');
      return;
    }

    await handleEquipmentImageAnalysis(imageData);
  };

  const readImageAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result !== 'string') {
          reject(new Error('Failed to read file'));
          return;
        }
        resolve(result.includes(',') ? result.split(',')[1] : result);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }
      
      const img = new Image();
      
      img.onload = () => {
        try {
          const maxWidth = 1024;
          const maxHeight = 1024;
          let { width, height } = img;
          
          // Calculate new dimensions while maintaining aspect ratio
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
          resolve(compressedBase64);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const showRejectedScanFeedback = (type: VisionScanType, result: VisionAnalysisResult) => {
    const feedback = getVisionRejectionFeedback(result, type);
    toast({
      ...feedback,
      variant: "destructive",
    });
  };

  const showAlreadySavedFeedback = (type: VisionScanType, foundAgainCount = 0) => {
    toast({
      title: "Already saved",
      description: `No new ${type === 'pantry' ? 'pantry items' : 'kitchen tools'} were added from that scan.${foundAgainCopy(foundAgainCount)}`,
    });
  };

  const handlePantryImageAnalysis = async (imageData: string) => {
    const scan = startInventoryScan('pantry');
    try {
      // Detect if image is HEIC format
      const isHEIC = imageData.includes('data:image/heic') || imageData.includes('data:image/heif');
      
      const result = await analyzeImage(imageData, isHEIC, { signal: scan.controller.signal, scanType: 'pantry' }) as VisionAnalysisResult;
      if (!isActiveInventoryScan('pantry', scan.id, scan.controller)) return;
      console.log('Pantry image analysis result:', result);

      if (isRejectedVisionResult(result)) {
        showRejectedScanFeedback('pantry', result);
        return;
      }

      const detectedIngredients = extractVisionLabels(result, 'pantry');
      
      if (detectedIngredients.length > 0) {
        // Clean and remove duplicates
        const cleanIngredients = detectedIngredients
          .map(i => normalizeEntryLabel(String(i).toLowerCase()))
          .filter(i => i && i.length > 1);
        const mergeResult = mergeUniqueEntriesWithMetadata(profile.pantryIngredients, cleanIngredients);
        updateInventoryItems('pantry', mergeResult.items);
        markReviewEntries('pantry', mergeResult.added, 'recent');
        markReviewEntries('pantry', mergeResult.foundAgain, 'found-again');

        if (mergeResult.added.length === 0) {
          showAlreadySavedFeedback('pantry', mergeResult.foundAgain.length);
          return;
        }
        
        toast({
          title: "Pantry scan complete",
          description: `Found ${mergeResult.added.length} new ingredient${mergeResult.added.length === 1 ? '' : 's'}: ${mergeResult.added.slice(0, 3).join(', ')}${mergeResult.added.length > 3 ? '...' : ''}${foundAgainCopy(mergeResult.foundAgain.length)}`
        });
      } else {
        toast({
          title: "No ingredients detected",
          description: "Try taking a clearer photo or add items manually.",
          variant: "destructive"
        });
      }
    } catch (error) {
      if (isAbortError(error) || !isActiveInventoryScan('pantry', scan.id, scan.controller)) return;

      console.error('Error analyzing pantry image:', error);
      toast({
        title: "Analysis failed",
        description: "I couldn't analyze that photo. Check your connection and try again.",
        variant: "destructive"
      });
    } finally {
      finishInventoryScan('pantry', scan.id, scan.controller);
    }
  };

  const handleEquipmentImageAnalysis = async (imageData: string) => {
    const scan = startInventoryScan('kitchen');
    try {
      // Detect if image is HEIC format
      const isHEIC = imageData.includes('data:image/heic') || imageData.includes('data:image/heif');
      
      const result = await analyzeImage(imageData, isHEIC, { signal: scan.controller.signal, scanType: 'kitchen' }) as VisionAnalysisResult;
      if (!isActiveInventoryScan('kitchen', scan.id, scan.controller)) return;
      console.log('Equipment image analysis result:', result);

      if (isRejectedVisionResult(result)) {
        showRejectedScanFeedback('kitchen', result);
        return;
      }

      const detectedEquipment = extractVisionLabels(result, 'kitchen');
      
      if (detectedEquipment.length > 0) {
        // Clean and remove duplicates
        const cleanEquipment = detectedEquipment
          .map(e => normalizeEntryLabel(String(e).toLowerCase()))
          .filter(e => e && e.length > 1);
        const mergeResult = mergeUniqueEntriesWithMetadata(profile.kitchenEquipment, cleanEquipment);
        updateInventoryItems('kitchen', mergeResult.items);
        markReviewEntries('kitchen', mergeResult.added, 'recent');
        markReviewEntries('kitchen', mergeResult.foundAgain, 'found-again');

        if (mergeResult.added.length === 0) {
          showAlreadySavedFeedback('kitchen', mergeResult.foundAgain.length);
          return;
        }
        
        toast({
          title: "Kitchen scan complete",
          description: `Found ${mergeResult.added.length} new item${mergeResult.added.length === 1 ? '' : 's'}: ${mergeResult.added.slice(0, 3).join(', ')}${mergeResult.added.length > 3 ? '...' : ''}${foundAgainCopy(mergeResult.foundAgain.length)}`
        });
      } else {
        toast({
          title: "No equipment detected",
          description: "Try taking a clearer photo or add items manually.",
          variant: "destructive"
        });
      }
    } catch (error) {
      if (isAbortError(error) || !isActiveInventoryScan('kitchen', scan.id, scan.controller)) return;

      console.error('Error analyzing kitchen image:', error);
      toast({
        title: "Analysis failed",
        description: "I couldn't analyze that photo. Check your connection and try again.",
        variant: "destructive"
      });
    } finally {
      finishInventoryScan('kitchen', scan.id, scan.controller);
    }
  };

  const handleMultipleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'pantry' | 'kitchen') => {
    if (hasActiveScan) {
      showScanBlockedToast('starting another scan');
      event.target.value = '';
      return;
    }

    const files = event.target.files;
    if (!files || files.length === 0) return;
    const maxFiles = SCAN_UPLOAD_LIMITS[type];
    const selectedFiles = Array.from(files);

    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const processedFiles = selectedFiles.filter(file => {
      const fileType = file.type.toLowerCase();
      const fileName = file.name.toLowerCase();
      const isHEIC = fileName.endsWith('.heic') || fileName.endsWith('.heif');
      return supportedTypes.includes(fileType) || isHEIC;
    });

    if (processedFiles.length > maxFiles) {
      toast({
        title: "Too many photos",
        description: `${scanAreaLabel(type)} scan accepts up to ${maxFiles} photos per refresh. Select ${maxFiles} or fewer supported photos and try again.`,
        variant: "destructive"
      });
      event.target.value = '';
      return;
    }

    if (processedFiles.length === 0) {
      toast({
        title: "Unsupported file format",
        description: "Please upload JPEG, PNG, GIF, WebP, or HEIC image files.",
        variant: "destructive"
      });
      event.target.value = '';
      return;
    }

    if (processedFiles.length !== selectedFiles.length) {
      toast({
        title: "Some files skipped",
        description: `Unsupported files do not count toward the ${maxFiles}-photo ${type} refresh limit. Processing ${processedFiles.length} supported photo${processedFiles.length === 1 ? '' : 's'}.`
      });
    }

    const scan = startInventoryScan(type, processedFiles.length);

    // Collect all results first, then update state once
    let allNewIngredients: string[] = [];
    let allNewEquipment: string[] = [];
    let rejectedCount = 0;
    let failedCount = 0;
    let lastRejectedResult: VisionAnalysisResult | null = null;
    let lastError: unknown = null;
    let completedCount = 0;

    try {
      await processWithBoundedConcurrency(processedFiles, SCAN_ANALYSIS_CONCURRENCY, async (file, i) => {
        if (!isActiveInventoryScan(type, scan.id, scan.controller)) return;

        const fileName = file.name.toLowerCase();
        const isHEIC = fileName.endsWith('.heic') || fileName.endsWith('.heif');

        try {
          let result: VisionAnalysisResult;
          if (isHEIC) {
            const base64Data = await readImageAsBase64(file);
            if (!isActiveInventoryScan(type, scan.id, scan.controller)) return;
            result = await analyzeImage(base64Data, true, { signal: scan.controller.signal, scanType: type }) as VisionAnalysisResult;
          } else {
            // Handle regular image files
            const compressedBase64 = await compressImage(file);
            if (!isActiveInventoryScan(type, scan.id, scan.controller)) return;
            result = await analyzeImage(compressedBase64, false, { signal: scan.controller.signal, scanType: type }) as VisionAnalysisResult;
          }

          if (!isActiveInventoryScan(type, scan.id, scan.controller)) return;

          if (isRejectedVisionResult(result)) {
            rejectedCount += 1;
            lastRejectedResult = result;
            return;
          }

          // Extract ingredients or equipment from this image
          if (type === 'pantry' && result) {
            const detectedIngredients = extractVisionLabels(result, 'pantry');
            
            if (detectedIngredients.length > 0) {
              const cleanIngredients = detectedIngredients
                .map(i => normalizeEntryLabel(String(i).toLowerCase()))
                .filter(i => i && i.length > 1);
              allNewIngredients = [...allNewIngredients, ...cleanIngredients];
              console.log('Added ingredients:', cleanIngredients);
            }
          } else if (type === 'kitchen' && result) {
            const detectedEquipment = extractVisionLabels(result, 'kitchen');
            
            if (detectedEquipment.length > 0) {
              const cleanEquipment = detectedEquipment
                .map(e => normalizeEntryLabel(String(e).toLowerCase()))
                .filter(e => e && e.length > 1);
              allNewEquipment = [...allNewEquipment, ...cleanEquipment];
              console.log('Added equipment:', cleanEquipment);
            }
          }
        } catch (error) {
          if (isAbortError(error) || !isActiveInventoryScan(type, scan.id, scan.controller)) return;

          console.error(`Error processing image ${i + 1}:`, error);
          failedCount += 1;
          lastError = error;
        } finally {
          if (isActiveInventoryScan(type, scan.id, scan.controller)) {
            completedCount += 1;
            setScanProgress(prev => ({
              ...prev,
              [type]: { completed: completedCount, total: processedFiles.length },
            }));
          }
        }
      }, {
        shouldContinue: () => isActiveInventoryScan(type, scan.id, scan.controller),
      });

      if (!isActiveInventoryScan(type, scan.id, scan.controller)) return;

      // Update state once with all accumulated results
      if (type === 'pantry' && allNewIngredients.length > 0) {
        const mergeResult = mergeUniqueEntriesWithMetadata(profile.pantryIngredients, allNewIngredients);
        updateInventoryItems('pantry', mergeResult.items);
        markReviewEntries('pantry', mergeResult.added, 'recent');
        markReviewEntries('pantry', mergeResult.foundAgain, 'found-again');

        if (mergeResult.added.length === 0) {
          showAlreadySavedFeedback('pantry', mergeResult.foundAgain.length);
        } else {
          toast({
            title: `Scan complete!`,
            description: `Found ${mergeResult.added.length} new ingredient${mergeResult.added.length === 1 ? '' : 's'} across ${processedFiles.length} image(s).${foundAgainCopy(mergeResult.foundAgain.length)}${
              rejectedCount > 0 ? ` ${rejectedCount} text-only photo${rejectedCount === 1 ? ' was' : 's were'} skipped.` : ''
            }${
              failedCount > 0 ? ` ${failedCount} photo${failedCount === 1 ? ' could' : 's could'} not be scanned.` : ''
            }`
          });
        }
      } else if (type === 'kitchen' && allNewEquipment.length > 0) {
        const mergeResult = mergeUniqueEntriesWithMetadata(profile.kitchenEquipment, allNewEquipment);
        updateInventoryItems('kitchen', mergeResult.items);
        markReviewEntries('kitchen', mergeResult.added, 'recent');
        markReviewEntries('kitchen', mergeResult.foundAgain, 'found-again');

        if (mergeResult.added.length === 0) {
          showAlreadySavedFeedback('kitchen', mergeResult.foundAgain.length);
        } else {
          toast({
            title: `Scan complete!`,
            description: `Found ${mergeResult.added.length} new equipment item${mergeResult.added.length === 1 ? '' : 's'} across ${processedFiles.length} image(s).${foundAgainCopy(mergeResult.foundAgain.length)}${
              rejectedCount > 0 ? ` ${rejectedCount} text-only photo${rejectedCount === 1 ? ' was' : 's were'} skipped.` : ''
            }${
              failedCount > 0 ? ` ${failedCount} photo${failedCount === 1 ? ' could' : 's could'} not be scanned.` : ''
            }`
          });
        }
      } else if (rejectedCount > 0 && lastRejectedResult) {
        showRejectedScanFeedback(type, lastRejectedResult);
      } else if (failedCount > 0) {
        console.error('Every selected scan photo failed:', lastError);
        toast({
          title: "Photos were not scanned",
          description: "I couldn't finish that refresh. Try again in a moment, upload clearer photos, or enter items manually.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "No items detected",
          description: "Try taking clearer photos or add items manually.",
          variant: "destructive"
        });
      }
    } catch (error) {
      if (isAbortError(error) || !isActiveInventoryScan(type, scan.id, scan.controller)) return;

      console.error('Error processing multiple images:', error);
      toast({
        title: "Processing error",
        description: "I couldn't process every photo. Try again or upload one at a time.",
        variant: "destructive"
      });
    } finally {
      finishInventoryScan(type, scan.id, scan.controller);
    }
    
    event.target.value = '';
  };

  const handleManualEntry = (type: 'pantry' | 'kitchen') => {
    if (hasActiveScan) {
      showScanBlockedToast('editing inventory');
      return;
    }

    const value = manualEntry[type];
    if (!value.trim()) return;

    const newEntries = parseCommaSeparatedEntries(value);
    if (type === 'pantry') {
      const correctionResult = correctPantryManualEntries(newEntries);
      const mergeResult = mergeUniqueEntriesWithMetadata(profile.pantryIngredients, correctionResult.entries);

      updateInventoryItems('pantry', mergeResult.items);
      markReviewEntries('pantry', mergeResult.added, 'recent');
      showPantryCorrectionToast(newEntries, correctionResult.corrections, mergeResult.added);
    } else {
      const mergeResult = mergeUniqueEntriesWithMetadata(profile.kitchenEquipment, newEntries);
      updateInventoryItems('kitchen', mergeResult.items);
      markReviewEntries('kitchen', mergeResult.added, 'recent');
    }
    setManualEntry(prev => ({ ...prev, [type]: '' }));
  };

  const sectionCards = [
    {
      id: 'pantry' as const,
      title: 'Pantry',
      description: `${profile.pantryIngredients.length} item${profile.pantryIngredients.length === 1 ? '' : 's'} saved`,
      icon: Package,
      tone: 'pantry',
    },
    {
      id: 'kitchen' as const,
      title: 'Kitchen',
      description: `${profile.kitchenEquipment.length} tool${profile.kitchenEquipment.length === 1 ? '' : 's'} saved`,
      icon: Settings,
      tone: 'kitchen',
    },
    {
      id: 'profile' as const,
      title: 'Cooking Profile',
      description: profile.cookingSkill ? `${profile.cookingSkill} skill and dietary notes` : 'Skill and dietary notes',
      icon: User,
      tone: 'profile',
    },
  ];

  const activeScanRows = [
    { id: 'pantry' as const, label: 'Pantry', active: isAnalyzingPantry, progress: scanProgress.pantry },
    { id: 'kitchen' as const, label: 'Kitchen', active: isAnalyzingEquipment, progress: scanProgress.kitchen },
  ].filter((row) => row.active);

  const renderActiveScanNotice = () => {
    if (activeScanRows.length === 0) return null;

    return (
      <div className="setup-surface flex items-center gap-3 p-4 text-primary" role="status" aria-live="polite">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--setup-coral-soft)/0.9)]">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-[hsl(var(--setup-ink))]">Inventory scan still running</p>
          <p className="setup-copy text-xs">
            {activeScanRows.map((row) =>
              row.progress
                ? `${row.label}: ${row.progress.completed} of ${row.progress.total} photos`
                : `${row.label}: scanning photo`
            ).join(' | ')}
          </p>
        </div>
      </div>
    );
  };

  const renderSectionNav = () => (
    <div className="returning-section-nav" aria-label="Settings sections">
      {sectionCards.map((section) => {
        const Icon = section.icon;
        return (
          <button
            key={section.id}
            type="button"
            className="returning-nav-pill"
            data-active={activeSection === section.id}
            onClick={() => setActiveSection(section.id)}
          >
            <Icon className="h-4 w-4" />
            <span>{section.title}</span>
          </button>
        );
      })}
    </div>
  );

  const renderHub = () => (
    <div className="space-y-4">
      <div className="returning-hero">
        <p className="returning-kicker">Settings</p>
        <h1 className="returning-display text-[2.45rem] font-extrabold leading-none">Keep Laica matched to your kitchen.</h1>
        <p className="returning-copy mt-3 max-w-sm text-sm leading-relaxed">
          Update the pantry, tools, and cooking profile Laica uses for Planning and Slop Bowl.
        </p>
      </div>

      <div className="space-y-3">
        {sectionCards.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              type="button"
              className="returning-hub-card"
              data-tone={section.tone}
              onClick={() => setActiveSection(section.id)}
            >
              <span className="returning-hub-icon" data-tone={section.tone}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1 text-left">
                <span className="block font-extrabold text-[hsl(var(--returning-ink))]">{section.title}</span>
                <span className="returning-copy block text-sm">{section.description}</span>
              </span>
              <span className="text-xl font-black text-primary">›</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderInventorySection = (type: 'pantry' | 'kitchen') => {
    const isPantry = type === 'pantry';
    const items = isPantry ? profile.pantryIngredients : profile.kitchenEquipment;
    const isAnalyzing = isPantry ? isAnalyzingPantry : isAnalyzingEquipment;
    const isInventoryLocked = hasActiveScan;
    const uploadId = isPantry ? 'pantry-upload' : 'equipment-upload';
    const manualId = isPantry ? 'manual-ingredients' : 'manual-equipment';
    const title = isPantry ? 'Pantry' : 'Kitchen';
    const description = isPantry
      ? 'Update what Laica can cook with.'
      : 'Update tools, pans, heat, and appliances.';
    const placeholder = isPantry ? 'rice, eggs, spinach' : 'oven, blender, sheet pan';
    const handleSave = isPantry ? handleSavePantry : handleSaveEquipment;
    const handleReset = isPantry ? handleResetPantry : handleResetEquipment;
    const progress = scanProgress[type];

    return (
      <div className={`returning-setup-anchor space-y-4 ${isPantry ? '' : 'setup-ui-kitchen returning-kitchen-tone'}`}>
        {renderSectionNav()}
        <section className="returning-panel">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="returning-kicker">{isPantry ? 'Returning setup' : 'Equipment setup'}</p>
              <h1 className="setup-display text-[2.25rem] font-extrabold leading-[1.02] text-[hsl(var(--setup-ink))]">{title}</h1>
              <p className="setup-copy mt-2 max-w-[20rem] text-sm leading-relaxed">{description}</p>
            </div>
            <span className="returning-count">{items.length}</span>
          </div>

          <div className="mt-5 space-y-5">
            <NativeCamera
              variant="setup"
              setupTone={isPantry ? 'pantry' : 'kitchen'}
              title={isPantry ? 'Pantry preview' : 'Kitchen preview'}
              captureLabel={isPantry ? 'Capture pantry' : 'Capture kitchen'}
              cameraToggleLabel={isPantry ? 'Pantry camera' : 'Kitchen camera'}
              tipsTitle={isPantry ? 'Pantry scan tips' : 'Kitchen scan tips'}
              tipsDescription={isPantry
                ? 'Open cabinets, use good light, and scan one area at a time.'
                : 'Point at tools and appliances you actually cook with. Fixed fixtures can stay out.'}
              showUploadButton={false}
              disabled={isInventoryLocked}
              onImageCapture={isPantry ? handlePantryImageCapture : handleEquipmentImageCapture}
              onError={(error) => {
                toast({
                  title: 'Camera issue',
                  description: error,
                  variant: 'destructive',
                });
              }}
            />

            <div className="space-y-3">
              <input
                id={uploadId}
                type="file"
                accept="image/*,.heic,.heif"
                multiple
                onChange={(e) => handleMultipleImageUpload(e, type)}
                disabled={isInventoryLocked}
                className="hidden"
              />
              <div className="grid gap-3">
                <Button
                  type="button"
                  className="setup-secondary-button h-14 w-full justify-start px-4"
                  variant="ghost"
                  onClick={() => document.getElementById(uploadId)?.click()}
                  disabled={isInventoryLocked}
                >
                  <span className={`setup-action-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[hsl(var(--setup-coral-soft)/0.85)] text-primary ${!isPantry ? 'setup-kitchen-action-icon' : ''}`}>
                    <ImagePlus className="h-4 w-4" />
                  </span>
                  <span className="flex flex-col items-start leading-tight">
                    <span className="setup-action-title">Upload photos</span>
                  </span>
                </Button>

                <Button
                  type="button"
                  className="setup-secondary-button h-14 w-full justify-start px-4"
                  variant="ghost"
                  onClick={() => setManualOpen(prev => ({ ...prev, [type]: !prev[type] }))}
                  aria-expanded={manualOpen[type]}
                  aria-pressed={manualOpen[type]}
                  data-active={manualOpen[type] ? 'true' : undefined}
                  disabled={isInventoryLocked}
                >
                  <span className={`setup-action-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[hsl(var(--setup-butter)/0.42)] text-[hsl(var(--setup-herb))] ${!isPantry ? 'setup-kitchen-action-icon' : ''}`}>
                    <Package className="h-4 w-4" />
                  </span>
                  <span className="flex flex-col items-start leading-tight">
                    <span className="setup-action-title">Enter manually</span>
                  </span>
                </Button>
              </div>

              {manualOpen[type] && (
                <div className="setup-surface space-y-3 p-4">
                  <div className="flex items-center gap-3">
                    <div className={`setup-illustration flex h-12 w-12 shrink-0 items-center justify-center text-primary ${!isPantry ? 'setup-kitchen-illustration' : ''}`}>
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-extrabold text-[hsl(var(--setup-ink))]">
                        {isPantry ? 'Add pantry items' : 'Add kitchen tools'}
                      </p>
                      <p className="setup-copy text-xs">Use short names so the list stays easy to skim.</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Input
                      id={manualId}
                      aria-label={isPantry ? 'Pantry items' : 'Kitchen tools'}
                      value={manualEntry[type]}
                      onChange={(event) => setManualEntry(prev => ({ ...prev, [type]: event.target.value }))}
                      placeholder={placeholder}
                      className={`h-12 rounded-2xl border-primary/20 bg-white/75 text-base font-bold placeholder:text-muted-foreground ${!isPantry ? 'setup-kitchen-input' : ''}`}
                      disabled={isInventoryLocked}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          handleManualEntry(type);
                        }
                      }}
                    />
                    {isPantry && <p className="setup-copy px-1 text-xs">Separate pantry items with commas.</p>}
                    <Button
                      type="button"
                      variant="ghost"
                      className={`setup-primary-button h-12 w-full ${!isPantry ? 'setup-kitchen-primary-button' : ''}`}
                      onClick={() => handleManualEntry(type)}
                      disabled={isInventoryLocked}
                    >
                      Save {isPantry ? 'ingredients' : 'equipment'}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {isAnalyzing && (
              <div className="setup-surface p-4 text-center text-primary">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--setup-coral-soft)/0.9)]">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
                <p className="mt-2 text-sm font-extrabold">
                  {progress
                    ? `Analyzing ${progress.completed} of ${progress.total} ${isPantry ? 'pantry' : 'kitchen'} photos...`
                    : isPantry ? 'Scanning pantry photos...' : 'Scanning kitchen photos...'}
                </p>
                <p className="setup-copy mt-1 text-xs">Keeping only visible food and cooking items.</p>
              </div>
            )}

            <div className="setup-surface space-y-3 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-extrabold text-[hsl(var(--setup-ink))]">{isPantry ? 'Your pantry list' : 'Your kitchen list'}</p>
                  <p className="setup-copy text-xs">Remove anything Laica should ignore.</p>
                </div>
                {items.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    className="setup-ghost-button text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={isInventoryLocked}
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Reset
                  </Button>
                )}
              </div>

              {items.length === 0 ? (
                <div className="returning-empty min-h-24">
                  <Package className="h-8 w-8 text-primary/70" />
                  <p className="setup-copy text-sm">{isPantry ? 'No pantry items saved yet.' : 'No kitchen tools saved yet.'}</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {items.map((item, index) => {
                    const wasRecentlyCorrected = isPantry
                      && recentlyCorrectedPantryKeys.has(normalizeEntryDuplicateKey(item));

                    return (
                      <InventoryReviewChip
                        key={`${item}-${index}`}
                        item={item}
                        state={getInventoryReviewChipState(inventoryReviewState, type, item)}
                        wasRecentlyCorrected={wasRecentlyCorrected}
                        disabled={isInventoryLocked}
                        onRemove={() => updateInventoryItems(type, items.filter((_, i) => i !== index))}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="returning-actions">
            <Button variant="ghost" className="setup-secondary-button h-12" onClick={() => setActiveSection('hub')}>
              Settings
            </Button>
            <Button
              variant="ghost"
              className={`setup-primary-button h-12 ${isPantry ? '' : 'setup-kitchen-primary-button'}`}
              onClick={handleSave}
              disabled={isInventoryLocked}
            >
              {isPantry ? 'Save pantry' : 'Save kitchen'}
            </Button>
          </div>
        </section>
      </div>
    );
  };

  const renderProfileSection = () => {
    const selectedDietary = new Set(profile.dietaryRestrictions);
    const noRestrictionsOption = dietaryOptions[0];
    const remainingDietaryOptions = dietaryOptions.slice(1);

    return (
      <div className="returning-setup-anchor space-y-4">
        {renderSectionNav()}
        <section className="returning-panel">
          <p className="returning-kicker">Cooking Profile</p>
          <h1 className="setup-display text-[2.25rem] font-extrabold leading-[1.02] text-[hsl(var(--setup-ink))]">How Laica adapts.</h1>
          <p className="setup-copy mt-2 max-w-[20rem] text-sm leading-relaxed">
            Keep skill level and dietary notes current so suggestions stay useful.
          </p>

          <div className="mt-6 space-y-5">
            <div className="space-y-3">
              <Label className="text-sm font-extrabold text-[hsl(var(--setup-ink))]">Cooking skill</Label>
              <div role="radiogroup" aria-label="Cooking skill level" className="space-y-3">
                {skillLevels.map((skill) => {
                  const selected = profile.cookingSkill === skill.value;
                  return (
                    <button
                      key={skill.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      data-selected={selected}
                      onClick={() => setProfile(prev => ({ ...prev, cookingSkill: skill.value }))}
                      className="setup-choice flex w-full items-center gap-4 p-4 text-left transition"
                    >
                      <span className="setup-illustration-token h-14 w-14 shrink-0" aria-hidden="true">
                        {skill.illustration}
                      </span>
                      <span className="flex-1">
                        <span className="block font-extrabold text-[hsl(var(--setup-ink))]">{skill.label}</span>
                        <span className="setup-copy text-sm">{skill.description}</span>
                      </span>
                      {selected && <Check className="h-5 w-5 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-extrabold text-[hsl(var(--setup-ink))]">Dietary notes</Label>
              <button
                type="button"
                aria-pressed={selectedDietary.has('No restrictions')}
                data-selected={selectedDietary.has('No restrictions')}
                onClick={() => handleDietaryChange('No restrictions')}
                className="setup-choice setup-none-choice mb-5 flex w-full items-center gap-4 p-4 text-left transition"
              >
                <span className="setup-illustration-token h-14 w-14 shrink-0" aria-hidden="true">
                  {noRestrictionsOption.illustration}
                </span>
                <span className="flex-1">
                  <span className="block font-extrabold text-[hsl(var(--setup-ink))]">No restrictions</span>
                  <span className="setup-copy text-sm">Use this when there is nothing special to avoid.</span>
                </span>
                <span className={`flex h-6 w-6 items-center justify-center rounded-full border ${selectedDietary.has('No restrictions') ? 'border-primary bg-primary text-primary-foreground' : 'border-[hsl(var(--setup-ink)/0.24)]'}`}>
                  {selectedDietary.has('No restrictions') && <Check className="h-3.5 w-3.5" />}
                </span>
              </button>

              <div className="space-y-2">
                {remainingDietaryOptions.map((diet) => {
                  const selected = selectedDietary.has(diet.label);
                  return (
                    <button
                      key={diet.label}
                      type="button"
                      aria-pressed={selected}
                      data-selected={selected}
                      onClick={() => handleDietaryChange(diet.label)}
                      className="setup-choice flex w-full items-center gap-3 p-3 text-left transition"
                    >
                      <span className="setup-illustration-token h-11 w-11 shrink-0 text-[1.35rem]" aria-hidden="true">
                        {diet.illustration}
                      </span>
                      <span className="flex-1 font-extrabold text-[hsl(var(--setup-ink))]">{diet.label}</span>
                      <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${selected ? 'border-primary bg-primary text-primary-foreground' : 'border-[hsl(var(--setup-ink)/0.24)]'}`}>
                        {selected && <Check className="h-3 w-3" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="returning-actions">
            <Button variant="ghost" className="setup-secondary-button h-12" onClick={() => setActiveSection('hub')}>
              Settings
            </Button>
            <Button variant="ghost" className="setup-primary-button h-12" onClick={handleSaveProfile}>
              Save profile
            </Button>
          </div>
        </section>
      </div>
    );
  };

  const renderActiveSection = () => {
    if (activeSection === 'pantry') return renderInventorySection('pantry');
    if (activeSection === 'kitchen') return renderInventorySection('kitchen');
    if (activeSection === 'profile') return renderProfileSection();
    return renderHub();
  };

  const showCrossSectionScanNotice = activeScanRows.some((row) => activeSection !== row.id);

  return (
    <main className="returning-ui min-h-screen pb-24">
      <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-4 py-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            className="returning-back-button"
            onClick={handleBack}
          >
            Back
          </Button>
          <span className="returning-mini-chip">Settings</span>
        </div>

        {showCrossSectionScanNotice && (
          <div className="mb-4">
            {renderActiveScanNotice()}
          </div>
        )}

        {renderActiveSection()}
      </div>
    </main>
  );
}
