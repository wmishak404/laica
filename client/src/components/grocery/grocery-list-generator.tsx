import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { fetchGroceryList } from '@/lib/openai';
import { withDemoErrorHandling } from '@/lib/rateLimitHandler';
import { Loader2 } from 'lucide-react';

interface GroceryListGeneratorProps {
  onGenerateList: (groceryData: any) => void;
}

export default function GroceryListGenerator({ onGenerateList }: GroceryListGeneratorProps) {
  const [recipes, setRecipes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recipes.trim()) {
      setError('Please enter at least one recipe');
      return;
    }
    
    setError('');
    setIsLoading(true);
    
    const recipeList = recipes.split('\n').filter(r => r.trim());
    const response = await withDemoErrorHandling(async () => {
      return await fetchGroceryList(recipeList);
    }, 'grocery list generation');
    
    if (response) {
      onGenerateList(response);
    } else {
      setError('Failed to generate grocery list. Please try again.');
    }
    
    setIsLoading(false);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-2xl font-bold mb-4">Generate Grocery List</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <Label htmlFor="recipes">Enter recipes (one per line):</Label>
            <Textarea
              id="recipes"
              placeholder="Garlic Butter Shrimp Pasta
Chicken Caesar Salad
Beef Stir Fry with Vegetables"
              className="mt-1"
              rows={5}
              value={recipes}
              onChange={(e) => setRecipes(e.target.value)}
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
          
          <Button 
            type="submit" 
            className="bg-secondary hover:bg-secondary/90 text-white w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Grocery List'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
