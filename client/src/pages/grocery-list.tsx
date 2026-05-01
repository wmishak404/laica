import { useState } from 'react';
import Footer from '@/components/layout/footer';
import GroceryListGenerator from '@/components/grocery/grocery-list-generator';
import GroceryItem from '@/components/grocery/grocery-item';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PrinterCheck, Share2, Lightbulb } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface GroceryItemType {
  id: string;
  name: string;
  price?: string;
  category: string;
  checked: boolean;
}

interface GroceryCategory {
  name: string;
  items: GroceryItemType[];
}

interface GeneratedGroceryItem {
  name: string;
  price?: string;
}

interface GeneratedGroceryCategory {
  name: string;
  items: GeneratedGroceryItem[];
}

interface GeneratedGroceryData {
  categories: GeneratedGroceryCategory[];
}

function isGeneratedGroceryData(value: unknown): value is GeneratedGroceryData {
  return Boolean(
    value &&
    typeof value === 'object' &&
    'categories' in value &&
    Array.isArray((value as GeneratedGroceryData).categories)
  );
}

export default function GroceryList() {
  const [groceryList, setGroceryList] = useState<GroceryCategory[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [estimatedTotal, setEstimatedTotal] = useState<string>('');
  const [itemCount, setItemCount] = useState<number>(0);
  const [listGenerated, setListGenerated] = useState(false);

  const handleGenerateList = (groceryData: unknown) => {
    if (isGeneratedGroceryData(groceryData)) {
      // Transform API response to our format
      const transformedList: GroceryCategory[] = groceryData.categories.map((category: GeneratedGroceryCategory) => ({
        name: category.name,
        items: category.items.map((item: GeneratedGroceryItem, idx: number) => ({
          id: `${category.name.toLowerCase()}-${idx}`,
          name: item.name,
          price: item.price || undefined,
          category: category.name,
          checked: false
        }))
      }));
      
      setGroceryList(transformedList);
      
      // Calculate estimated total and item count
      let total = 0;
      let count = 0;
      
      transformedList.forEach((category: GroceryCategory) => {
        category.items.forEach((item: GroceryItemType) => {
          count++;
          if (item.price) {
            // Remove $ and convert to number
            const price = parseFloat(item.price.replace('$', ''));
            if (!isNaN(price)) {
              total += price;
            }
          }
        });
      });
      
      setEstimatedTotal(`$${total.toFixed(2)}`);
      setItemCount(count);
      
      // Generate some suggestions
      setSuggestions([
        {
          type: 'budget',
          original: 'Salmon fillets ($14.99)',
          alternative: 'Tilapia fillets ($7.99)',
          saving: '$7.00'
        },
        {
          type: 'pantry',
          item: 'Olive oil',
          lastPurchased: '3 weeks ago'
        },
        {
          type: 'seasonal',
          item: 'Asparagus',
          note: 'In season and 30% off'
        }
      ]);
      
      setListGenerated(true);
    } else {
      // Fallback if API response is not as expected
      const fallbackList = [
        {
          name: 'Produce',
          items: [
            { id: 'produce1', name: '2 medium onions', price: '$1.50', category: 'Produce', checked: false },
            { id: 'produce2', name: '1 bunch fresh parsley', price: '$0.99', category: 'Produce', checked: false },
            { id: 'produce3', name: '3 lemons', price: '$2.25', category: 'Produce', checked: false },
            { id: 'produce4', name: '2 bell peppers', price: '$1.98', category: 'Produce', checked: false },
          ]
        },
        {
          name: 'Protein',
          items: [
            { id: 'protein1', name: '1 lb shrimp, peeled and deveined', price: '$12.99', category: 'Protein', checked: false },
            { id: 'protein2', name: '2 chicken breasts', price: '$5.50', category: 'Protein', checked: false },
          ]
        },
        {
          name: 'Pantry',
          items: [
            { id: 'pantry1', name: '1 box pasta', price: '$1.79', category: 'Pantry', checked: false },
            { id: 'pantry2', name: 'Extra virgin olive oil', price: '$8.99', category: 'Pantry', checked: false },
          ]
        }
      ];
      
      setGroceryList(fallbackList);
      setEstimatedTotal('$36.00');
      setItemCount(8);
      
      setSuggestions([
        {
          type: 'budget',
          original: 'Shrimp ($12.99)',
          alternative: 'Tilapia ($7.99)',
          saving: '$5.00'
        },
        {
          type: 'pantry',
          item: 'Olive oil',
          lastPurchased: '3 weeks ago'
        },
        {
          type: 'seasonal',
          item: 'Asparagus',
          note: 'In season and pairs well with pasta dishes'
        }
      ]);
      
      setListGenerated(true);
    }
  };

  const handleItemCheck = (id: string, checked: boolean) => {
    setGroceryList(prevList => 
      prevList.map(category => ({
        ...category,
        items: category.items.map(item => 
          item.id === id ? { ...item, checked } : item
        )
      }))
    );
  };

  return (
    <>
      <main>
        <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-6 md:py-8">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Smart Grocery Lists</h1>
            <p className="text-lg mb-4">Generate shopping lists based on your meal plans with smart suggestions</p>
          </div>
        </section>

        <section className="py-8 md:py-12 bg-white">
          <div className="container mx-auto px-4">
            <Tabs defaultValue={listGenerated ? "current" : "generate"}>
              <TabsList className="mb-6">
                <TabsTrigger value="generate">Generate List</TabsTrigger>
                <TabsTrigger value="current" disabled={!listGenerated}>Current List</TabsTrigger>
              </TabsList>
              
              <TabsContent value="generate">
                <div className="max-w-2xl mx-auto">
                  <GroceryListGenerator onGenerateList={handleGenerateList} />
                </div>
              </TabsContent>
              
              <TabsContent value="current">
                {listGenerated && (
                  <Card className="shadow-sm">
                    <CardContent className="p-6 md:p-8">
                      <div className="flex flex-col lg:flex-row gap-8">
                        <div className="lg:w-2/3">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold">Weekly Meal Plan Shopping List</h3>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon" title="PrinterCheck list">
                                <PrinterCheck className="h-5 w-5 text-gray-500 hover:text-primary" />
                              </Button>
                              <Button variant="ghost" size="icon" title="Share list">
                                <Share2 className="h-5 w-5 text-gray-500 hover:text-primary" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {groceryList.map((category, idx) => (
                              <div key={idx} className={idx >= Math.ceil(groceryList.length / 2) ? 'md:col-start-2' : ''}>
                                <h4 className="font-bold mb-3 pb-2 border-b border-gray-200">{category.name}</h4>
                                <ul className="space-y-2">
                                  {category.items.map(item => (
                                    <li key={item.id}>
                                      <GroceryItem 
                                        id={item.id}
                                        name={item.name}
                                        price={item.price}
                                        category={item.category}
                                        onCheck={handleItemCheck}
                                        checked={item.checked}
                                      />
                                    </li>
                                  ))}
                                </ul>
                                {idx < Math.ceil(groceryList.length / 2) - 1 && (
                                  <div className="mt-6 mb-3">
                                    <Separator />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          
                          <div className="mt-6 flex justify-between pt-4 border-t border-gray-200">
                            <div>
                              <span className="text-sm text-gray-500">Estimated Total:</span>
                              <span className="ml-2 font-bold">{estimatedTotal}</span>
                            </div>
                            <div>
                              <span className="text-sm text-gray-500">Items:</span>
                              <span className="ml-2 font-bold">{itemCount}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="lg:w-1/3 bg-gray-50 rounded-lg p-5">
                          <h4 className="font-bold mb-4 flex items-center">
                            <Lightbulb className="text-accent mr-2 h-5 w-5" /> Smart Suggestions
                          </h4>
                          
                          <div className="space-y-4">
                            {suggestions.map((suggestion, idx) => (
                              <Card key={idx} className="shadow-sm">
                                <CardContent className="p-4">
                                  {suggestion.type === 'budget' && (
                                    <>
                                      <h5 className="font-semibold text-sm mb-2">Budget Alternative</h5>
                                      <div className="flex justify-between items-center">
                                        <div>
                                          <p className="text-gray-500 text-sm line-through">{suggestion.original}</p>
                                          <p className="text-primary text-sm font-medium">{suggestion.alternative}</p>
                                        </div>
                                        <Button variant="default" size="sm" className="text-xs bg-primary text-white px-2 py-1 rounded hover:bg-primary/90 transition">
                                          Swap
                                        </Button>
                                      </div>
                                    </>
                                  )}
                                  
                                  {suggestion.type === 'pantry' && (
                                    <>
                                      <h5 className="font-semibold text-sm mb-2">In Your Pantry</h5>
                                      <div className="flex justify-between items-center">
                                        <div>
                                          <p className="text-gray-500 text-sm">You already have {suggestion.item}</p>
                                          <p className="text-secondary text-xs">Last purchased {suggestion.lastPurchased}</p>
                                        </div>
                                        <Button variant="default" size="sm" className="text-xs bg-secondary text-white px-2 py-1 rounded hover:bg-secondary/90 transition">
                                          Remove
                                        </Button>
                                      </div>
                                    </>
                                  )}
                                  
                                  {suggestion.type === 'seasonal' && (
                                    <>
                                      <h5 className="font-semibold text-sm mb-2">Seasonal Item</h5>
                                      <div className="flex justify-between items-center">
                                        <div>
                                          <p className="text-gray-500 text-sm">Add {suggestion.item} (in season)</p>
                                          <p className="text-secondary text-xs">{suggestion.note}</p>
                                        </div>
                                        <Button variant="default" size="sm" className="text-xs bg-secondary text-white px-2 py-1 rounded hover:bg-secondary/90 transition">
                                          Add
                                        </Button>
                                      </div>
                                    </>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
