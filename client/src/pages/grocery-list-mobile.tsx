import { useState } from 'react';
import { Link } from 'wouter';
import GroceryListGenerator from '@/components/grocery/grocery-list-generator';
import GroceryItem from '@/components/grocery/grocery-item';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Share2, ShoppingCart, Plus, CheckCircle } from 'lucide-react';

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

export default function GroceryListMobile() {
  const [groceryList, setGroceryList] = useState<GroceryCategory[]>([]);
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
            const price = parseFloat(item.price.replace(/[^0-9.]/g, ''));
            if (!isNaN(price)) {
              total += price;
            }
          }
        });
      });
      
      setEstimatedTotal(total > 0 ? `$${total.toFixed(2)}` : '');
      setItemCount(count);
      setListGenerated(true);
    }
  };

  const handleItemCheck = (id: string, checked: boolean) => {
    setGroceryList(prev => 
      prev.map(category => ({
        ...category,
        items: category.items.map(item =>
          item.id === id ? { ...item, checked } : item
        )
      }))
    );
  };

  const checkedItemsCount = groceryList.reduce((total, category) => 
    total + category.items.filter(item => item.checked).length, 0
  );

  const shareList = () => {
    if (navigator.share) {
      const listText = groceryList.map(category => 
        `${category.name}:\n${category.items.map(item => `- ${item.name}`).join('\n')}`
      ).join('\n\n');
      
      navigator.share({
        title: 'My Grocery List',
        text: listText
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Mobile Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <Link href="/">
              <Button variant="ghost" size="sm" className="mr-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Grocery List</h1>
          </div>
          {listGenerated && (
            <Button variant="ghost" size="sm" onClick={shareList}>
              <Share2 className="h-5 w-5" />
            </Button>
          )}
        </div>
        
        {/* Progress Bar */}
        {listGenerated && itemCount > 0 && (
          <div className="px-4 pb-3">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>{checkedItemsCount} of {itemCount} items</span>
              {estimatedTotal && <span>{estimatedTotal}</span>}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-[#4ECDC4] h-2 rounded-full transition-all duration-300" 
                style={{ width: `${itemCount > 0 ? (checkedItemsCount / itemCount) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4">
        {!listGenerated ? (
          <div className="space-y-6">
            <Card>
              <CardHeader className="text-center">
                <div className="bg-[#4ECDC4] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">Create Your Smart Grocery List</CardTitle>
                <p className="text-gray-600 text-sm">
                  Generate an optimized shopping list based on your meal plans and pantry items
                </p>
              </CardHeader>
            </Card>

            <GroceryListGenerator onGenerateList={handleGenerateList} />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Quick Stats */}
            <Card className="bg-gradient-to-r from-[#4ECDC4]/10 to-[#FF6B6B]/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-[#4ECDC4] mr-2" />
                    <span className="font-medium">Shopping Progress</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{Math.round((checkedItemsCount / itemCount) * 100)}%</div>
                    <div className="text-xs text-gray-600">Complete</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Grocery Categories */}
            {groceryList.map((category) => (
              <Card key={category.name}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>{category.name}</span>
                    <span className="text-sm font-normal text-gray-500">
                      {category.items.filter(item => item.checked).length}/{category.items.length}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  {category.items.map((item) => (
                    <GroceryItem
                      key={item.id}
                      id={item.id}
                      name={item.name}
                      price={item.price}
                      category={item.category}
                      onCheck={handleItemCheck}
                      checked={item.checked}
                    />
                  ))}
                </CardContent>
              </Card>
            ))}

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <Button 
                onClick={() => setListGenerated(false)}
                variant="outline" 
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Generate New List
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
