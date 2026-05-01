import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage: string;
}

export function FeedbackModal({ isOpen, onClose, currentPage }: FeedbackModalProps) {
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      toast({
        title: "Please enter your feedback",
        description: "We need your feedback before we can submit it.",
        variant: "destructive"
      });
      return;
    }

    if (feedback.length > 300) {
      toast({
        title: "Feedback too long",
        description: "Please keep your feedback to 300 characters or less.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest('POST', '/api/feedback', {
        feedbackText: feedback.trim(),
        currentPage: currentPage
      });

      toast({
        title: "Feedback received!",
        description: "Thank you for your feedback. We appreciate your input.",
      });

      // Reset form and close modal
      setFeedback("");
      onClose();
    } catch (error) {
      toast({
        title: "Failed to submit feedback",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFeedback("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Feedback</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            We value your feedback. Please leave your comment here and include important details where you can.
          </p>
          
          <Textarea
            placeholder="Share your thoughts, suggestions, or report any issues..."
            value={feedback}
            onChange={(e) => {
              if (e.target.value.length <= 300) {
                setFeedback(e.target.value);
              }
            }}
            rows={4}
            className="resize-none"
          />
          
          <div className="flex justify-end space-x-2 pt-2">
            <Button 
              variant="outline" 
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting || !feedback.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
