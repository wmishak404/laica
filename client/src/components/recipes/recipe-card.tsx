import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Star, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Recipe } from '@shared/schema';

interface RecipeCardProps {
  recipe: Recipe;
  className?: string;
}

export default function RecipeCard({ recipe, className = '' }: RecipeCardProps) {
  return (
    <Card className={`overflow-hidden shadow-sm hover:shadow-md transition ${className}`}>
      <img 
        src={recipe.imageUrl || `https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500`} 
        alt={recipe.name} 
        className="w-full h-48 object-cover" 
      />
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-3">
          <h3 className="recipe-title text-lg font-bold">{recipe.name}</h3>
          <span className="bg-accent/20 text-foreground text-xs px-2 py-1 rounded-full">{recipe.cookTime} min</span>
        </div>
        <p className="text-gray-500 text-sm mb-4 line-clamp-2">{recipe.description}</p>
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-sm mr-4">
              <Star className="h-4 w-4 text-accent inline mr-1" />{' '}
              {recipe.rating || 4.5}
            </span>
            <span className="text-sm">
              <Utensils className="h-4 w-4 text-primary inline mr-1" />{' '}
              {recipe.difficulty}
            </span>
          </div>
          <Link href={`/cooking?recipe=${recipe.id}`}>
            <Button variant="ghost" size="icon" className="text-secondary hover:text-primary transition">
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
