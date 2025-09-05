import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { NativeCamera } from '@/components/ui/native-camera';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, Upload } from 'lucide-react';
import { analyzeImage } from '@/lib/openai';

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
  existingProfile?: UserProfile;
}

export default function UserProfiling({ onProfileComplete, existingProfile }: UserProfilingProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [showKitchenSettings, setShowKitchenSettings] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(existingProfile || {
    cookingSkill: '',
    dietaryRestrictions: [],
    weeklyTime: '',
    pantryIngredients: [],
    kitchenEquipment: [],
    favoriteChefs: []
  });
  const [showPantryCamera, setShowPantryCamera] = useState(false);
  const [showEquipmentCamera, setShowEquipmentCamera] = useState(false);
  const [isAnalyzingPantry, setIsAnalyzingPantry] = useState(false);
  const [isAnalyzingEquipment, setIsAnalyzingEquipment] = useState(false);

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
          
          ctx.drawImage(img, 0, 0, width, height);
          // Always convert to JPEG format for API compatibility
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          const base64Data = compressedDataUrl.split(',')[1];
          
          // Clean up
          URL.revokeObjectURL(img.src);
          
          resolve(base64Data);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      
      // Create object URL that works with all formats including HEIC
      try {
        img.src = URL.createObjectURL(file);
      } catch (error) {
        reject(new Error('Unsupported file format'));
      }
    });
  };

  const processIngredientResults = async (result: any) => {
    console.log('Image analysis result:', result);
    
    if (result) {
      let detectedIngredients: string[] = [];
      
      // Check if result has ingredients array with objects that have name property
      if (result.ingredients && Array.isArray(result.ingredients)) {
        detectedIngredients = result.ingredients.map((item: any) => 
          typeof item === 'string' ? item : item.name || item.ingredient || String(item)
        );
      }
      
      // Also try to extract from text fields
      const analysisText = result.analysis || result.description || result.detected_items || '';
      if (analysisText) {
        const textIngredients = analysisText.match(/\b(?:meat|chicken|beef|pork|fish|salmon|tuna|shrimp|flour|sugar|eggs|milk|butter|oil|onions|garlic|tomatoes|cheese|bread|rice|pasta|salt|pepper|herbs|spices|vegetables|fruits|beans|nuts|potatoes|carrots|lettuce|spinach|broccoli|mushrooms|bell peppers|cucumbers|avocado|bananas|apples|oranges|lemons|limes|berries|yogurt|cream|vinegar|soy sauce|olive oil|coconut oil|honey|maple syrup|vanilla|cinnamon|paprika|cumin|oregano|basil|thyme|rosemary|ginger|turmeric|chili|hot sauce|ketchup|mustard|mayonnaise|pasta sauce|coconut milk|almond milk|quinoa|oats|cereal|crackers|cookies|chocolate|coffee|tea|wine|beer|juice|water|ice|frozen foods|canned goods|condiments|sauces|dressings|seasonings|baking powder|baking soda|yeast|stock|broth)\b/gi) || [];
        detectedIngredients = [...detectedIngredients, ...textIngredients];
      }
      
      if (detectedIngredients.length > 0) {
        const cleanIngredients: string[] = detectedIngredients
          .map(i => i.toLowerCase().trim())
          .filter(i => i && i.length > 1);
        const uniqueIngredients: string[] = Array.from(new Set(cleanIngredients));
        const newIngredients: string[] = Array.from(new Set([...profile.pantryIngredients, ...uniqueIngredients]));
        setProfile(prev => ({ ...prev, pantryIngredients: newIngredients }));
        console.log('Added ingredients:', uniqueIngredients);
        
        // Show success notification
        alert(`Pantry scan complete! Found ${uniqueIngredients.length} items: ${uniqueIngredients.slice(0, 3).join(', ')}${uniqueIngredients.length > 3 ? '...' : ''}`);
      } else {
        // Show no ingredients found notification
        alert('No ingredients detected in the image. Try taking a clearer photo or add items manually.');
      }
    }
  };

  const processEquipmentResults = async (result: any) => {
    console.log('Equipment analysis result:', result);
    
    if (result) {
      let detectedEquipment: string[] = [];
      
      // Check if result has equipment array with objects that have name property
      if (result.equipment && Array.isArray(result.equipment)) {
        detectedEquipment = result.equipment.map((item: any) => {
          if (typeof item === 'string') {
            return item;
          } else if (typeof item === 'object' && item !== null) {
            return item.name || item.item || item.equipment || item.description || '';
          } else {
            return '';
          }
        }).filter((item: string) => item && typeof item === 'string' && item.trim().length > 0);
      }
      
      // Also check for detected_items that might be equipment
      if (result.detected_items && Array.isArray(result.detected_items)) {
        const equipmentItems = result.detected_items
          .map((item: any) => item.item || item.name || String(item))
          .filter((item: string) => {
            const itemLower = item.toLowerCase();
            return itemLower.includes('pot') || itemLower.includes('pan') || itemLower.includes('oven') ||
                   itemLower.includes('coffee') || itemLower.includes('blender') || itemLower.includes('mixer') ||
                   itemLower.includes('knife') || itemLower.includes('appliance') || itemLower.includes('machine');
          });
        detectedEquipment = [...detectedEquipment, ...equipmentItems];
      }
      
      // Also try to extract from text fields with expanded pattern matching
      const analysisText = result.analysis || result.description || '';
      if (analysisText) {
        const textEquipment = analysisText.match(/\b(?:stove|oven|microwave|refrigerator|freezer|dishwasher|blender|mixer|food processor|toaster|coffee maker|coffee machine|espresso machine|kettle|slow cooker|pressure cooker|air fryer|grill|griddle|wok|skillet|frying pan|pan|pot|small pot|large pot|saucepan|stockpot|dutch oven|red dutch oven|blue dutch oven|baking sheet|cutting board|knife|chef knife|paring knife|bread knife|cleaver|peeler|grater|whisk|spatula|tongs|ladle|colander|strainer|measuring cups|measuring spoons|scale|thermometer|timer|can opener|bottle opener|corkscrew|rolling pin|pastry brush|mortar pestle|stand mixer|hand mixer|immersion blender|juicer|mandoline|kitchen shears|salad spinner|ice cream maker|bread maker|rice cooker|steamer|fondue pot|waffle maker|pancake griddle|deep fryer|smoker|dehydrator|vacuum sealer|sous vide|instant pot|ninja|kitchenaid|cuisinart|vitamix|breville)\b/gi) || [];
        detectedEquipment = [...detectedEquipment, ...textEquipment];
      }
      
      if (detectedEquipment.length > 0) {
        const cleanEquipment: string[] = detectedEquipment
          .map(e => e.toLowerCase().trim())
          .filter(e => e && e.length > 1);
        const uniqueEquipment: string[] = Array.from(new Set(cleanEquipment));
        const newEquipment: string[] = Array.from(new Set([...profile.kitchenEquipment, ...uniqueEquipment]));
        setProfile(prev => ({ ...prev, kitchenEquipment: newEquipment }));
        console.log('Added equipment:', uniqueEquipment);
      }
    }
  };

  const handlePantryImageAnalysis = async (imageData: string) => {
    setIsAnalyzingPantry(true);
    try {
      const result = await analyzeImage(imageData, false); // Camera typically produces JPEG/PNG, not HEIC
      await processIngredientResults(result);
    } catch (error) {
      console.error('Error analyzing pantry image:', error);
      alert('Error processing image. Please try again or use the "Upload Images" option.');
    } finally {
      setIsAnalyzingPantry(false);
      setShowPantryCamera(false);
    }
  };

  const handleEquipmentImageAnalysis = async (imageData: string) => {
    setIsAnalyzingEquipment(true);
    try {
      const result = await analyzeImage(imageData, false); // Camera typically produces JPEG/PNG, not HEIC
      await processEquipmentResults(result);
    } catch (error) {
      console.error('Error analyzing kitchen image:', error);
      alert('Error processing image. Please try again or use the "Upload Images" option.');
    } finally {
      setIsAnalyzingEquipment(false);
      setShowEquipmentCamera(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'pantry' | 'kitchen') => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();
    const isHEIC = fileName.endsWith('.heic') || fileName.endsWith('.heif');
    
    // Handle HEIC files by reading them as base64 and sending to server for conversion
    if (isHEIC) {
      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64 = e.target?.result as string;
          const base64Data = base64.split(',')[1]; // Remove data:image/... prefix
          
          if (type === 'pantry') {
            await handlePantryImageAnalysisWithHEIC(base64Data, true);
          } else {
            await handleEquipmentImageAnalysisWithHEIC(base64Data, true);
          }
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Error processing HEIC image:', error);
        alert('Error processing HEIC image. Please try a different image or use the camera option.');
      }
      event.target.value = '';
      return;
    }

    // Check for other supported formats
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!supportedTypes.includes(fileType)) {
      alert('Please upload a JPEG, PNG, GIF, WebP, or HEIC image file.');
      event.target.value = '';
      return;
    }

    try {
      const compressedBase64 = await compressImage(file);
      if (type === 'pantry') {
        await handlePantryImageAnalysisWithHEIC(compressedBase64, false);
      } else {
        await handleEquipmentImageAnalysisWithHEIC(compressedBase64, false);
      }
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Error processing image. Please try a different image or use the camera option.');
    }
    
    event.target.value = '';
  };

  const handleMultipleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'pantry' | 'kitchen') => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const processedFiles = Array.from(files).filter(file => {
      const fileType = file.type.toLowerCase();
      const fileName = file.name.toLowerCase();
      const isHEIC = fileName.endsWith('.heic') || fileName.endsWith('.heif');
      return supportedTypes.includes(fileType) || isHEIC;
    });

    if (processedFiles.length === 0) {
      alert('Please upload JPEG, PNG, GIF, WebP, or HEIC image files.');
      event.target.value = '';
      return;
    }

    if (processedFiles.length !== files.length) {
      alert(`${files.length - processedFiles.length} files were skipped (unsupported format). Processing ${processedFiles.length} images.`);
    }

    // Set analyzing state
    if (type === 'pantry') {
      setIsAnalyzingPantry(true);
    } else {
      setIsAnalyzingEquipment(true);
    }

    // Collect all results first, then update state once
    let allNewIngredients: string[] = [];
    let allNewEquipment: string[] = [];

    try {
      // Process files sequentially to avoid overwhelming the API
      for (let i = 0; i < processedFiles.length; i++) {
        const file = processedFiles[i];
        const fileType = file.type.toLowerCase();
        const fileName = file.name.toLowerCase();
        const isHEIC = fileName.endsWith('.heic') || fileName.endsWith('.heif');

        try {
          let result;
          if (isHEIC) {
            // Handle HEIC files
            const reader = new FileReader();
            result = await new Promise<any>((resolve, reject) => {
              reader.onload = async (e) => {
                try {
                  const base64 = e.target?.result as string;
                  const base64Data = base64.split(',')[1];
                  const analysisResult = await analyzeImage(base64Data, true);
                  resolve(analysisResult);
                } catch (error) {
                  reject(error);
                }
              };
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
          } else {
            // Handle regular image files
            const compressedBase64 = await compressImage(file);
            result = await analyzeImage(compressedBase64, false);
          }

          // Extract ingredients or equipment from this image
          if (type === 'pantry' && result) {
            let detectedIngredients: string[] = [];
            
            if (result.ingredients && Array.isArray(result.ingredients)) {
              detectedIngredients = result.ingredients.map((item: any) => 
                typeof item === 'string' ? item : item.name || item.ingredient || String(item)
              );
            }
            
            if (detectedIngredients.length > 0) {
              const cleanIngredients = detectedIngredients
                .map(i => i.toLowerCase().trim())
                .filter(i => i && i.length > 1);
              allNewIngredients = [...allNewIngredients, ...cleanIngredients];
              console.log('Added ingredients:', cleanIngredients);
            }
          } else if (type === 'kitchen' && result) {
            let detectedEquipment: string[] = [];
            
            if (result.equipment && Array.isArray(result.equipment)) {
              detectedEquipment = result.equipment.map((item: any) => {
                if (typeof item === 'string') {
                  return item;
                } else if (typeof item === 'object' && item !== null) {
                  return item.name || item.item || item.equipment || item.description || '';
                } else {
                  return '';
                }
              }).filter((item: string) => item && typeof item === 'string' && item.trim().length > 0);
            }
            
            if (detectedEquipment.length > 0) {
              const cleanEquipment = detectedEquipment
                .map(e => e.toLowerCase().trim())
                .filter(e => e && e.length > 1);
              allNewEquipment = [...allNewEquipment, ...cleanEquipment];
              console.log('Added equipment:', cleanEquipment);
            }
          }
          
          // Small delay between processing images to avoid overwhelming the API
          if (i < processedFiles.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (error) {
          console.error(`Error processing image ${i + 1}:`, error);
          // Continue processing other images even if one fails
        }
      }

      // Update state once with all accumulated results
      if (type === 'pantry' && allNewIngredients.length > 0) {
        const uniqueNewIngredients = Array.from(new Set(allNewIngredients));
        setProfile(prev => ({
          ...prev,
          pantryIngredients: Array.from(new Set([...prev.pantryIngredients, ...uniqueNewIngredients]))
        }));
        console.log('Total unique ingredients added:', uniqueNewIngredients);
      } else if (type === 'kitchen' && allNewEquipment.length > 0) {
        const uniqueNewEquipment = Array.from(new Set(allNewEquipment));
        setProfile(prev => ({
          ...prev,
          kitchenEquipment: Array.from(new Set([...prev.kitchenEquipment, ...uniqueNewEquipment]))
        }));
        console.log('Total unique equipment added:', uniqueNewEquipment);
      }
    } catch (error) {
      console.error('Error processing multiple images:', error);
      alert('Some images could not be processed. Please try again or use individual uploads.');
    } finally {
      // Reset analyzing state
      if (type === 'pantry') {
        setIsAnalyzingPantry(false);
        setShowPantryCamera(false);
      } else {
        setIsAnalyzingEquipment(false);
        setShowEquipmentCamera(false);
      }
    }
    
    event.target.value = '';
  };

  const handlePantryImageAnalysisWithHEIC = async (imageData: string, isHEIC: boolean) => {
    setIsAnalyzingPantry(true);
    try {
      const result = await analyzeImage(imageData, isHEIC);
      await processIngredientResults(result);
    } catch (error) {
      console.error('Error analyzing pantry image:', error);
    } finally {
      setIsAnalyzingPantry(false);
      setShowPantryCamera(false);
    }
  };

  const handleEquipmentImageAnalysisWithHEIC = async (imageData: string, isHEIC: boolean) => {
    setIsAnalyzingEquipment(true);
    try {
      const result = await analyzeImage(imageData, isHEIC);
      await processEquipmentResults(result);
    } catch (error) {
      console.error('Error analyzing equipment image:', error);
    } finally {
      setIsAnalyzingEquipment(false);
      setShowEquipmentCamera(false);
    }
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
              <div className="flex gap-2 flex-wrap">
                <Button 
                  variant="outline" 
                  onClick={() => setShowPantryCamera(true)}
                  className="flex items-center gap-2"
                  disabled={isAnalyzingPantry}
                >
                  <Camera className="h-4 w-4" />
                  Take Photo
                </Button>
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('pantry-upload-profile')?.click()}
                  className="flex items-center gap-2"
                  disabled={isAnalyzingPantry}
                >
                  <Upload className="h-4 w-4" />
                  Upload Images
                </Button>
                <input
                  id="pantry-upload-profile"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleMultipleImageUpload(e, 'pantry')}
                  className="hidden"
                />
                {isAnalyzingPantry && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    Analyzing image...
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Take a photo or upload multiple images of your pantry, or add ingredients manually below
              </p>
              
              {/* Manual ingredient entry */}
              <div className="mt-4">
                <Label htmlFor="manual-ingredients">Add ingredients manually:</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="manual-ingredients"
                    placeholder="e.g., onions"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const input = document.getElementById('manual-ingredients') as HTMLInputElement;
                      if (input && input.value.trim()) {
                        const newIngredients = input.value.split(',').map(i => i.trim()).filter(i => i.length > 0);
                        setProfile(prev => ({
                          ...prev,
                          pantryIngredients: [...prev.pantryIngredients, ...newIngredients]
                        }));
                        input.value = '';
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  You may enter "onions" or multiple ingredients separated by a comma (e.g. apples, oranges)
                </p>
              </div>
              
              {/* Show added ingredients */}
              {profile.pantryIngredients.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-600">Ingredients added:</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setProfile(prev => ({
                          ...prev,
                          pantryIngredients: []
                        }));
                      }}
                      className="text-xs h-7 px-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                    >
                      Reset Pantry
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {profile.pantryIngredients.map((ingredient, index) => (
                      <span 
                        key={index} 
                        className="bg-secondary/10 text-secondary text-xs px-2 py-1 rounded-full flex items-center gap-1"
                      >
                        {ingredient}
                        <button
                          onClick={() => {
                            setProfile(prev => ({
                              ...prev,
                              pantryIngredients: prev.pantryIngredients.filter((_, i) => i !== index)
                            }));
                          }}
                          className="text-secondary/60 hover:text-secondary text-xs"
                          type="button"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Having trouble with accuracy? Use "Reset Pantry" to clear everything and start fresh.
                  </p>
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
              <div className="flex gap-2 flex-wrap">
                <Button 
                  variant="outline" 
                  onClick={() => setShowEquipmentCamera(true)}
                  className="flex items-center gap-2"
                  disabled={isAnalyzingEquipment}
                >
                  <Camera className="h-4 w-4" />
                  Take Photo
                </Button>
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('equipment-upload-profile')?.click()}
                  className="flex items-center gap-2"
                  disabled={isAnalyzingEquipment}
                >
                  <Upload className="h-4 w-4" />
                  Upload Images
                </Button>
                <input
                  id="equipment-upload-profile"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleMultipleImageUpload(e, 'kitchen')}
                  className="hidden"
                />
                {isAnalyzingEquipment && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    Analyzing image...
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Take a photo or upload multiple images of your kitchen, or add equipment manually below
              </p>
              
              {/* Manual equipment entry */}
              <div className="mt-4">
                <Label htmlFor="manual-equipment">Add equipment manually:</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="manual-equipment"
                    placeholder="e.g., stove"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const input = document.getElementById('manual-equipment') as HTMLInputElement;
                      if (input && input.value.trim()) {
                        const newEquipment = input.value.split(',').map(i => i.trim()).filter(i => i.length > 0);
                        setProfile(prev => ({
                          ...prev,
                          kitchenEquipment: [...prev.kitchenEquipment, ...newEquipment]
                        }));
                        input.value = '';
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  You may enter "stove" or multiple equipment separated by a comma (e.g. oven, blender)
                </p>
              </div>
              
              {/* Show added equipment */}
              {profile.kitchenEquipment.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-600 mb-2">Equipment added:</p>
                  <div className="flex flex-wrap gap-1">
                    {profile.kitchenEquipment.map((equipment, index) => (
                      <span 
                        key={index} 
                        className="bg-secondary/10 text-secondary text-xs px-2 py-1 rounded-full flex items-center gap-1"
                      >
                        {equipment}
                        <button
                          onClick={() => {
                            setProfile(prev => ({
                              ...prev,
                              kitchenEquipment: prev.kitchenEquipment.filter((_, i) => i !== index)
                            }));
                          }}
                          className="text-secondary/60 hover:text-secondary text-xs"
                          type="button"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );


      case 6:
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
              </div>
              
              <div className="mt-4">
                <p className="text-sm text-gray-500 text-center">
                  Don't worry about being very accurate. We can always update your profile after this step.
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
          Step {currentStep} of 6 - This helps me give you personalized cooking guidance
        </p>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300" 
            style={{ width: `${(currentStep / 6) * 100}%` }}
          />
        </div>
      </div>

      {renderStep()}

      <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-4">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
          disabled={currentStep === 1}
          className="w-full sm:w-auto"
        >
          Previous
        </Button>
        
        {currentStep === 6 ? (
          <Button
            onClick={() => onProfileComplete(profile)}
            disabled={!canProceed()}
            className="w-full sm:w-auto"
          >
            Complete Profile
          </Button>
        ) : (
          <Button
            onClick={() => setCurrentStep(prev => Math.min(7, prev + 1))}
            disabled={!canProceed()}
            className="w-full sm:w-auto"
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
          <NativeCamera
            onImageCapture={async (imageData) => {
              try {
                const analysis = await analyzeImage(imageData);
                if (analysis && analysis.detectedIngredients) {
                  const ingredients = Array.from(new Set([...profile.pantryIngredients, ...analysis.detectedIngredients]));
                  setProfile(prev => ({ ...prev, pantryIngredients: ingredients }));
                }
                setShowPantryCamera(false);
              } catch (error) {
                console.error('Error analyzing pantry image:', error);
              }
            }}
            onError={(error) => {
              console.error('Camera error:', error);
              setShowPantryCamera(false);
            }}
            title="Take Photo of Pantry"
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showEquipmentCamera} onOpenChange={setShowEquipmentCamera}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Scan Your Kitchen Equipment</DialogTitle>
          </DialogHeader>
          <NativeCamera
            onImageCapture={async (imageData) => {
              try {
                const analysis = await analyzeImage(imageData);
                if (analysis && analysis.detectedEquipment) {
                  const equipment = Array.from(new Set([...profile.kitchenEquipment, ...analysis.detectedEquipment]));
                  setProfile(prev => ({ ...prev, kitchenEquipment: equipment }));
                }
                setShowEquipmentCamera(false);
              } catch (error) {
                console.error('Error analyzing kitchen image:', error);
              }
            }}
            onError={(error) => {
              console.error('Camera error:', error);
              setShowEquipmentCamera(false);
            }}
            title="Take Photo of Kitchen"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}