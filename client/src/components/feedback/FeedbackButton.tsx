import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';

interface FeedbackButtonProps {
  pageName: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive' | 'secondary';
}

export default function FeedbackButton({ pageName, className = '', variant = 'outline' }: FeedbackButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [category, setCategory] = useState('general');
  const { user } = useFirebaseAuth();
  const { toast } = useToast();

  const submitFeedbackMutation = useMutation({
    mutationFn: async (feedbackData: {
      pageName: string;
      feedbackText: string;
      category: string;
      userEmail?: string;
      userName?: string;
    }) => {
      return apiRequest('POST', '/api/feedback', feedbackData);
    },
    onSuccess: () => {
      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback! We'll use it to improve the app.",
      });
      setFeedbackText('');
      setCategory('general');
      setIsOpen(false);
    },
    onError: (error) => {
      console.error('Feedback submission error:', error);
      toast({
        title: "Submission Failed",
        description: "There was an issue submitting your feedback. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!feedbackText.trim()) {
      toast({
        title: "Feedback Required",
        description: "Please enter your feedback before submitting.",
        variant: "destructive",
      });
      return;
    }

    submitFeedbackMutation.mutate({
      pageName,
      feedbackText: feedbackText.trim(),
      category,
      userEmail: user?.email || undefined,
      userName: user?.displayName || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size="sm" className={className}>
          <MessageSquare className="w-4 h-4 mr-1" />
          Feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" />
            Share Your Feedback
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select feedback category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General Feedback</SelectItem>
                <SelectItem value="ui">User Interface</SelectItem>
                <SelectItem value="functionality">Functionality</SelectItem>
                <SelectItem value="suggestion">Suggestion</SelectItem>
                <SelectItem value="bug">Bug Report</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="feedback">Your Feedback</Label>
            <Textarea
              id="feedback"
              placeholder="Share your thoughts, suggestions, or report any issues you've encountered..."
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              className="min-h-[120px]"
              maxLength={1000}
            />
            <div className="text-sm text-gray-500 text-right">
              {feedbackText.length}/1000 characters
            </div>
          </div>
          <div className="text-sm text-gray-600 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
            <strong>Note:</strong> Your feedback helps us improve the app and enhance AI responses. 
            {user && (
              <span> We may follow up at {user.email} if needed.</span>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={submitFeedbackMutation.isPending || !feedbackText.trim()}
            >
              <Send className="w-4 h-4 mr-1" />
              {submitFeedbackMutation.isPending ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}