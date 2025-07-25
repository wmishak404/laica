import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { fetchIngredientAlternatives } from '@/lib/openai';
import { withDemoErrorHandling } from '@/lib/rateLimitHandler';
import { MoreHorizontal, Check, X } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface GroceryItemProps {
  id: string;
  name: string;
  price?: string;
  category: string;
  onCheck: (id: string, checked: boolean) => void;
  checked: boolean;
}

export default function GroceryItem({ id, name, price, category, onCheck, checked }: GroceryItemProps) {
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [isLoadingAlternatives, setIsLoadingAlternatives] = useState(false);

  const handleGetAlternatives = async (reason: string) => {
    setIsLoadingAlternatives(true);
    
    const response = await withDemoErrorHandling(async () => {
      return await fetchIngredientAlternatives(name, reason);
    }, 'ingredient alternatives');
    
    if (response && response.alternatives && Array.isArray(response.alternatives)) {
      setAlternatives(response.alternatives);
    } else {
      // Fallback alternatives
      setAlternatives([
        `Cheaper ${name.toLowerCase()}`,
        `Seasonal alternative to ${name.toLowerCase()}`,
        `Healthier version of ${name.toLowerCase()}`
      ]);
    }
    
    setIsLoadingAlternatives(false);
    setShowAlternatives(true);
  };

  return (
    <div className="flex items-center justify-between group py-1">
      <div className="flex items-center flex-1">
        <Checkbox 
          id={id} 
          checked={checked} 
          onCheckedChange={(isChecked) => onCheck(id, !!isChecked)}
        />
        <label 
          htmlFor={id} 
          className={`ml-2 text-sm flex-1 ${checked ? 'line-through text-gray-400' : ''}`}
        >
          {name}
        </label>
      </div>
      
      {price && (
        <div className="text-xs bg-accent/20 px-2 py-1 rounded-full ml-2">
          {price}
        </div>
      )}
      
      <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2">
            {!showAlternatives ? (
              <div className="space-y-1">
                <h4 className="text-sm font-medium mb-2">Find alternatives:</h4>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start text-left text-xs"
                  onClick={() => handleGetAlternatives('cheaper')}
                  disabled={isLoadingAlternatives}
                >
                  Cheaper options
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start text-left text-xs"
                  onClick={() => handleGetAlternatives('seasonal')}
                  disabled={isLoadingAlternatives}
                >
                  Seasonal alternatives
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start text-left text-xs"
                  onClick={() => handleGetAlternatives('healthier')}
                  disabled={isLoadingAlternatives}
                >
                  Healthier options
                </Button>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium">Alternatives:</h4>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6" 
                    onClick={() => setShowAlternatives(false)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                {isLoadingAlternatives ? (
                  <div className="text-center py-2">
                    <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-primary rounded-full mx-auto"></div>
                    <p className="text-xs mt-1">Finding alternatives...</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {alternatives.map((alt, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="text-xs">{alt}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 hover:text-green-500"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
