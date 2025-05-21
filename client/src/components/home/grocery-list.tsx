import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { PrinterCheck, Share2, Lightbulb } from 'lucide-react';

export default function GroceryListSection() {
  const [produceItems] = useState([
    { id: 'produce1', name: '2 medium onions', price: '$1.50', checked: false },
    { id: 'produce2', name: '1 bunch fresh parsley', price: '$0.99', checked: false },
    { id: 'produce3', name: '3 lemons', price: '$2.25', checked: false },
    { id: 'produce4', name: '2 bell peppers', price: '$1.98', checked: false },
  ]);

  const [proteinItems] = useState([
    { id: 'protein1', name: '1 lb shrimp, peeled and deveined', price: '$12.99', checked: false },
    { id: 'protein2', name: '2 chicken breasts', price: '$5.50', checked: false },
  ]);

  const [pantryItems] = useState([
    { id: 'pantry1', name: '1 box pasta', price: '$1.79', checked: false },
    { id: 'pantry2', name: 'Extra virgin olive oil', price: '$8.99', checked: false },
  ]);

  return (
    <section className="py-12 md:py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div className="mb-4 md:mb-0">
            <h2 className="text-3xl font-bold mb-2">Smart Grocery Lists</h2>
            <p className="text-gray-500">Never forget an ingredient with our smart shopping assistant</p>
          </div>
          <Button className="bg-secondary hover:bg-secondary/90 text-white px-6 py-3 rounded-full font-semibold transition self-start">
            Generate Shopping List
          </Button>
        </div>
        
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
                  <div>
                    <h4 className="font-bold mb-3 pb-2 border-b border-gray-200">Produce</h4>
                    <ul className="space-y-2">
                      {produceItems.map(item => (
                        <li key={item.id} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Checkbox id={item.id} />
                            <label htmlFor={item.id} className="ml-2 text-sm">{item.name}</label>
                          </div>
                          <div className="text-xs bg-accent/20 px-2 py-1 rounded-full">{item.price}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-bold mb-3 pb-2 border-b border-gray-200">Protein</h4>
                    <ul className="space-y-2">
                      {proteinItems.map(item => (
                        <li key={item.id} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Checkbox id={item.id} />
                            <label htmlFor={item.id} className="ml-2 text-sm">{item.name}</label>
                          </div>
                          <div className="text-xs bg-accent/20 px-2 py-1 rounded-full">{item.price}</div>
                        </li>
                      ))}
                    </ul>
                    
                    <h4 className="font-bold mb-3 pb-2 border-b border-gray-200 mt-6">Pantry</h4>
                    <ul className="space-y-2">
                      {pantryItems.map(item => (
                        <li key={item.id} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Checkbox id={item.id} />
                            <label htmlFor={item.id} className="ml-2 text-sm">{item.name}</label>
                          </div>
                          <div className="text-xs bg-accent/20 px-2 py-1 rounded-full">{item.price}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-between pt-4 border-t border-gray-200">
                  <div>
                    <span className="text-sm text-gray-500">Estimated Total:</span>
                    <span className="ml-2 font-bold">$36.00</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Items:</span>
                    <span className="ml-2 font-bold">10</span>
                  </div>
                </div>
              </div>
              
              <div className="lg:w-1/3 bg-gray-50 rounded-lg p-5">
                <h4 className="font-bold mb-4 flex items-center">
                  <Lightbulb className="text-accent mr-2 h-5 w-5" /> Smart Suggestions
                </h4>
                
                <div className="space-y-4">
                  <Card className="shadow-sm">
                    <CardContent className="p-4">
                      <h5 className="font-semibold text-sm mb-2">Budget Alternative</h5>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-gray-500 text-sm line-through">1 lb shrimp ($12.99)</p>
                          <p className="text-primary text-sm font-medium">1 lb tilapia ($7.99)</p>
                        </div>
                        <Button variant="default" size="sm" className="text-xs bg-primary text-white px-2 py-1 rounded hover:bg-primary/90 transition">
                          Swap
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="shadow-sm">
                    <CardContent className="p-4">
                      <h5 className="font-semibold text-sm mb-2">In Your Pantry</h5>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-gray-500 text-sm">You already have olive oil</p>
                          <p className="text-secondary text-xs">Last purchased 3 weeks ago</p>
                        </div>
                        <Button variant="default" size="sm" className="text-xs bg-secondary text-white px-2 py-1 rounded hover:bg-secondary/90 transition">
                          Remove
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="shadow-sm">
                    <CardContent className="p-4">
                      <h5 className="font-semibold text-sm mb-2">Seasonal Item</h5>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-gray-500 text-sm">Add asparagus (in season)</p>
                          <p className="text-secondary text-xs">Great with your pasta dish!</p>
                        </div>
                        <Button variant="default" size="sm" className="text-xs bg-secondary text-white px-2 py-1 rounded hover:bg-secondary/90 transition">
                          Add
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
