import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowRight, Star, Utensils } from 'lucide-react';
import { queryClient } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';
import { Recipe } from '@shared/schema';

function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
      <img 
        src={recipe.imageUrl || `https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500`} 
        alt={recipe.name} 
        className="w-full h-48 object-cover" 
      />
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <h3 className="recipe-title text-lg font-bold">{recipe.name}</h3>
          <span className="bg-accent/20 text-text text-xs px-2 py-1 rounded-full">{recipe.cookTime} min</span>
        </div>
        <p className="text-gray-500 text-sm mb-4">{recipe.description}</p>
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
          <Link href={`/recipes/${recipe.id}`}>
            <Button variant="ghost" size="icon" className="text-secondary hover:text-primary transition">
              <ArrowRight />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RecipeSection() {
  // Sample recipes for initial render
  const sampleRecipes = [
    {
      id: 1,
      name: "Spaghetti Aglio e Olio",
      description: "A simple, flavorful pasta dish with garlic, olive oil, and red pepper flakes.",
      imageUrl: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500",
      cookTime: 25,
      difficulty: "Easy",
      servings: 2,
      rating: 4.8,
      steps: []
    },
    {
      id: 2,
      name: "Summer Harvest Salad",
      description: "A refreshing salad with seasonal vegetables, avocado, and a light vinaigrette.",
      imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500",
      cookTime: 15,
      difficulty: "Easy",
      servings: 2,
      rating: 4.5,
      steps: []
    },
    {
      id: 3,
      name: "Herb-Crusted Salmon",
      description: "Perfectly baked salmon with a crispy herb crust, served with roasted vegetables.",
      imageUrl: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500",
      cookTime: 30,
      difficulty: "Medium",
      servings: 2,
      rating: 4.9,
      steps: []
    }
  ];

  const { data: recipes, isLoading, error } = useQuery<Recipe[]>({
    queryKey: ['/api/recipes'],
    initialData: sampleRecipes as Recipe[]
  });

  return (
    <section className="py-12 md:py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Popular Recipes</h2>
          <Link href="/recipes">
            <a className="text-primary hover:underline flex items-center">
              View all <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map(recipe => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </div>
    </section>
  );
}
