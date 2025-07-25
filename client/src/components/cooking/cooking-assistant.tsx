import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, Layers } from 'lucide-react';
import { fetchCookingAssistance } from '@/lib/openai';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface CookingAssistantProps {
  currentStep: string;
  isStepChanging?: boolean;
}

export default function CookingAssistant({ currentStep, isStepChanging = false }: CookingAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // When step changes, get initial guidance for the step
    if (currentStep && !isStepChanging) {
      setIsLoading(true);
      fetchCookingAssistance(currentStep)
        .then(response => {
          setMessages(prev => [
            ...prev, 
            { role: 'assistant', content: response || `Now let's focus on: ${currentStep}` }
          ]);
        })
        .catch(error => {
          console.error('Error getting assistant response:', error);
          setMessages(prev => [
            ...prev, 
            { role: 'assistant', content: `Now let's focus on: ${currentStep}` }
          ]);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [currentStep, isStepChanging]);

  useEffect(() => {
    // Scroll to bottom of messages when new messages are added
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendQuestion = async () => {
    if (question.trim() && !isLoading) {
      const userQuestion = question;
      setQuestion('');
      setMessages(prev => [...prev, { role: 'user', content: userQuestion }]);
      setIsLoading(true);
      
      try {
        const response = await fetchCookingAssistance(currentStep, userQuestion);
        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      } catch (error) {
        console.error('Error getting assistant response:', error);
        setMessages(prev => [
          ...prev, 
          { 
            role: 'assistant', 
            content: "I'm sorry, I'm having trouble answering that question right now. Please try again later." 
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
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
                  message.role === 'assistant' 
                    ? 'bg-secondary/10 assistant-message' 
                    : 'bg-primary/10 user-message'
                }`}
              >
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex">
              <div className="bg-secondary/10 assistant-message p-3 max-w-[85%]">
                <div className="flex space-x-1">
                  <div className="h-2 w-2 bg-secondary rounded-full animate-bounce"></div>
                  <div className="h-2 w-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="h-2 w-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="relative">
          <Input
            type="text" 
            placeholder="Ask a question about this step..." 
            className="w-full p-3 pr-10 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendQuestion()}
            disabled={isLoading}
          />
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-3 top-3 text-primary" 
            onClick={handleSendQuestion}
            disabled={isLoading}
          >
            <Layers className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
