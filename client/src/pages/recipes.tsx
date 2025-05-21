import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Recipe } from '@shared/schema';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import RecipeCard from '@/components/recipes/recipe-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Search, ChevronDown } from 'lucide-react';
import { fetchRecipeSuggestions } from '@/lib/openai';
import { useToast } from '@/hooks/use-toast';

// Sample recipes for initial render
const sampleRecipes = [
  {
    id: 1,
    name: "Spaghetti Aglio e Olio",
    description: "A simple, flavorful pasta dish with garlic, olive oil, and red pepper flakes.",
    imageUrl: "https://images.unsplash.com/photo-1589227365533-cee630bd59bd?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500",
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
    imageUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500",
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
  },
  {
    id: 4,
    name: "Vegetable Stir Fry",
    description: "A quick and healthy stir fry with colorful vegetables and a savory sauce.",
    imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500",
    cookTime: 20,
    difficulty: "Easy",
    servings: 4,
    rating: 4.3,
    steps: []
  },
  {
    id: 5,
    name: "Homemade Pizza",
    description: "Classic homemade pizza with a crispy crust, tomato sauce, and your favorite toppings.",
    imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500",
    cookTime: 45,
    difficulty: "Medium",
    servings: 4,
    rating: 4.7,
    steps: []
  },
  {
    id: 6,
    name: "Beef Bourguignon",
    description: "A classic French stew made with beef, red wine, mushrooms, and aromatic vegetables.",
    imageUrl: "https://images.unsplash.com/photo-1534939561126-855b8675edd7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500",
    cookTime: 180,
    difficulty: "Hard",
    servings: 6,
    rating: 4.9,
    steps: []
  }
];

export default function Recipes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [preferences, setPreferences] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const { toast } = useToast();

  const { data: recipes, isLoading } = useQuery<Recipe[]>({
    queryKey: ['/api/recipes'],
    initialData: sampleRecipes as Recipe[]
  });

  const filteredRecipes = recipes.filter(recipe => 
    recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSuggestRecipes = async () => {
    if (!preferences.trim()) {
      toast({
        title: "Please enter your preferences",
        description: "Let us know what kind of recipes you're looking for",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetchRecipeSuggestions(preferences);
      if (response && response.recipes && Array.isArray(response.recipes)) {
        setAiSuggestions(response.recipes);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error('Error generating recipe suggestions:', error);
      toast({
        title: "Failed to generate suggestions",
        description: "Please try again later",
        variant: "destructive"
      });
      // Set some fallback suggestions
      setAiSuggestions([
        {
          name: "Mediterranean Quinoa Bowl",
          description: "A protein-packed bowl with quinoa, roasted vegetables, and feta cheese.",
          cookTime: 30,
          difficulty: "Medium"
        },
        {
          name: "Spicy Black Bean Tacos",
          description: "Vegetarian tacos with seasoned black beans, avocado, and lime crema.",
          cookTime: 25,
          difficulty: "Easy"
        },
        {
          name: "Lemon Herb Roasted Chicken",
          description: "Juicy roasted chicken with a bright lemon and herb flavor profile.",
          cookTime: 60,
          difficulty: "Medium"
        }
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Header />
      <main>
        <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-8 md:py-12">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Discover Recipes</h1>
            <p className="text-lg mb-6">Find the perfect recipe for your next meal or get personalized suggestions</p>
            
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder="Search recipes"
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex flex-col md:flex-row gap-2">
                <Button variant="outline">
                  Filter <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
                <Button className="bg-primary text-white">Search</Button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-8 md:py-12 bg-white">
          <div className="container mx-auto px-4">
            <Tabs defaultValue="all">
              <div className="flex justify-between items-center mb-6">
                <TabsList>
                  <TabsTrigger value="all">All Recipes</TabsTrigger>
                  <TabsTrigger value="ai">AI Suggestions</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="all">
                {isLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    {filteredRecipes.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredRecipes.map(recipe => (
                          <RecipeCard key={recipe.id} recipe={recipe} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-gray-500">No recipes found matching your search</p>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="ai">
                <div className="bg-gray-50 p-6 rounded-lg mb-8">
                  <h2 className="text-xl font-bold mb-3">Get AI Recipe Suggestions</h2>
                  <p className="mb-4 text-gray-600">Tell us what you're looking for, your dietary preferences, or ingredients you'd like to use</p>
                  
                  <div className="flex flex-col md:flex-row gap-3">
                    <Input
                      placeholder="e.g., vegetarian dinner, quick lunch with chicken, or low-carb meal"
                      value={preferences}
                      onChange={(e) => setPreferences(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleSuggestRecipes} 
                      className="bg-secondary text-white"
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        'Get Suggestions'
                      )}
                    </Button>
                  </div>
                </div>

                {aiSuggestions.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {aiSuggestions.map((suggestion, idx) => (
                      <div key={idx} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
                        <div className="p-5">
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="recipe-title text-lg font-bold">{suggestion.name}</h3>
                            <span className="bg-accent/20 text-text text-xs px-2 py-1 rounded-full">{suggestion.cookTime || 30} min</span>
                          </div>
                          <p className="text-gray-500 text-sm mb-4">{suggestion.description}</p>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <span className="text-sm">
                                <span className="text-primary mr-1">•</span> {suggestion.difficulty || 'Medium'}
                              </span>
                            </div>
                            <Button className="bg-primary text-white rounded-full px-4 py-1 text-sm">
                              Start Cooking
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
