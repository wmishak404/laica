import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bot, Clock, Users, StepBack, StepForward, Layers, Camera, ClipboardCheck } from 'lucide-react';

export default function CookingDemo() {
  const [currentStep, setCurrentStep] = useState(2);
  const [progress, setProgress] = useState(40);
  const [messages, setMessages] = useState([
    { role: 'ai', content: "I see you're starting to cook the pasta. Make sure to salt your water generously - it should taste like sea water for the best flavor." },
    { role: 'user', content: "How much salt should I add exactly?" },
    { role: 'ai', content: "For 4 quarts of water (a typical pasta pot), add about 1-2 tablespoons of salt. This may seem like a lot, but most of it stays in the water!" },
    { role: 'ai', content: "I notice the water is boiling. Now is the perfect time to add your pasta. Don't forget to stir it occasionally to prevent sticking." }
  ]);
  const [question, setQuestion] = useState('');
  
  const totalSteps = 5;

  const handleNextStep = () => {
    if (currentStep < totalSteps) {
      const newStep = currentStep + 1;
      const newProgress = (newStep / totalSteps) * 100;
      setCurrentStep(newStep);
      setProgress(newProgress);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      const newStep = currentStep - 1;
      const newProgress = (newStep / totalSteps) * 100;
      setCurrentStep(newStep);
      setProgress(newProgress);
    }
  };

  const handleSendQuestion = () => {
    if (question.trim()) {
      setMessages([...messages, { role: 'user', content: question }]);
      
      // Mock AI response - in a real app, this would call the backend
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          role: 'ai', 
          content: "Great question! When cooking pasta, it's important to stir occasionally to ensure even cooking and prevent sticking." 
        }]);
      }, 1000);
      
      setQuestion('');
    }
  };

  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-4">Experience AI-Guided Cooking</h2>
        <p className="text-center text-gray-500 max-w-2xl mx-auto mb-12">
          See how CulinaryAI guides you through each step of the cooking process with real-time feedback and automatic progression.
        </p>
        
        <div className="bg-gray-50 rounded-xl p-6 md:p-8 max-w-4xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left side - Recipe and Steps */}
            <div className="lg:w-1/2">
              <Card className="mb-6">
                <CardContent className="p-5">
                  <h3 className="recipe-title text-xl font-bold mb-2">Garlic Butter Shrimp Pasta</h3>
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <span className="mr-4 flex items-center"><Clock className="h-4 w-4 mr-1" /> 25 min</span>
                    <span className="flex items-center"><Users className="h-4 w-4 mr-1" /> 2 servings</span>
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="font-bold mb-2">Current Step:</h4>
                    <p className="mb-3 font-medium">Cook the pasta according to package instructions until al dente.</p>
                    
                    <div className="relative pt-1 mb-4">
                      <div className="flex mb-2 items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold inline-block text-primary">
                            Step {currentStep} of {totalSteps}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold inline-block text-primary">
                            {progress}%
                          </span>
                        </div>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                    
                    <div className="flex gap-2 mb-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handlePrevStep}
                        disabled={currentStep <= 1}
                        className="px-4 py-2 border border-gray-200 rounded text-sm hover:bg-gray-50 transition"
                      >
                        <StepBack className="h-4 w-4 mr-1" /> Previous
                      </Button>
                      <Button 
                        className="px-4 py-2 bg-primary text-white rounded text-sm hover:bg-primary/90 transition flex-1"
                        size="sm"
                        onClick={handleNextStep}
                        disabled={currentStep >= totalSteps}
                      >
                        <StepForward className="h-4 w-4 mr-1" /> Next Step
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* AI Conversation UI */}
              <Card>
                <CardContent className="p-5">
                  <h4 className="font-bold mb-3 flex items-center">
                    <Bot className="text-secondary mr-2 h-5 w-5" /> Cooking Assistant
                  </h4>
                  
                  <div className="space-y-4 mb-4 h-56 overflow-y-auto p-2">
                    {messages.map((message, index) => (
                      <div 
                        key={index} 
                        className={`flex ${message.role === 'user' ? 'justify-end' : ''}`}
                      >
                        <div 
                          className={`p-3 max-w-[85%] ${
                            message.role === 'ai' 
                              ? 'bg-secondary/10 ai-message' 
                              : 'bg-primary/10 user-message'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="relative">
                    <Input
                      type="text" 
                      placeholder="Ask a question about this step..." 
                      className="w-full p-3 pr-10 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendQuestion()}
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-3 top-3 text-primary" 
                      onClick={handleSendQuestion}
                    >
                      <Layers className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Right side - Visual Guidance */}
            <div className="lg:w-1/2">
              <Card className="mb-6">
                <div className="bg-[#2D3436] p-3 text-white flex justify-between items-center rounded-t-lg">
                  <span className="font-medium">Live Cooking View</span>
                  <div>
                    <span className="bg-red-500 h-2 w-2 rounded-full inline-block"></span>
                    <span className="text-xs ml-1">Live</span>
                  </div>
                </div>
                <img 
                  src="https://images.unsplash.com/photo-1590794056487-9d874b6c744f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600" 
                  alt="Cooking in a home kitchen" 
                  className="w-full h-64 object-cover" 
                />
                
                <CardContent className="p-4">
                  <Alert className="bg-accent/10 mb-4">
                    <div className="flex items-center mb-1">
                      <Camera className="text-accent mr-2 h-4 w-4" />
                      <h4 className="font-bold text-sm">AI Detection</h4>
                    </div>
                    <AlertDescription className="text-xs text-gray-500">
                      I can see the pasta is cooking in properly boiling water. The bubbles are the right size, indicating good temperature.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                      <p className="text-xs text-gray-500 mb-1">Temperature</p>
                      <p className="font-bold">212°F <span className="text-green-500 text-xs">✓</span></p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                      <p className="text-xs text-gray-500 mb-1">Timer</p>
                      <p className="font-bold">5:23 <span className="text-xs">remaining</span></p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Ingredients checklist */}
              <Card>
                <CardContent className="p-5">
                  <h4 className="font-bold mb-3 flex items-center">
                    <Bot className="text-primary mr-2 h-5 w-5" /> Ingredients for this step
                  </h4>
                  
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Checkbox id="ingredient1" defaultChecked />
                      <label htmlFor="ingredient1" className="ml-2 text-sm">8 oz pasta</label>
                    </div>
                    <div className="flex items-center">
                      <Checkbox id="ingredient2" defaultChecked />
                      <label htmlFor="ingredient2" className="ml-2 text-sm">2 tsp salt (for pasta water)</label>
                    </div>
                    <div className="flex items-center opacity-50">
                      <Checkbox id="ingredient3" disabled />
                      <label htmlFor="ingredient3" className="ml-2 text-sm">4 tbsp butter (for later step)</label>
                    </div>
                    <div className="flex items-center opacity-50">
                      <Checkbox id="ingredient4" disabled />
                      <label htmlFor="ingredient4" className="ml-2 text-sm">1 lb shrimp (for later step)</label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
