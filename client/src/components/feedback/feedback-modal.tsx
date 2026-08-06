import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ApiRequestError, apiRequest } from "@/lib/queryClient";
import {
  FEEDBACK_TEXT_MAX_LENGTH,
  FEEDBACK_TEXT_TOO_LONG_CODE,
  FEEDBACK_TEXT_TOO_LONG_MESSAGE,
} from "@shared/feedback";

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
    const trimmedFeedback = feedback.trim();

    if (!trimmedFeedback) {
      toast({
        title: "Please enter your feedback",
        description: "We need your feedback before we can submit it.",
        variant: "destructive"
      });
      return;
    }

    if (trimmedFeedback.length > FEEDBACK_TEXT_MAX_LENGTH) {
      toast({
        title: "Feedback too long",
        description: FEEDBACK_TEXT_TOO_LONG_MESSAGE,
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest('POST', '/api/feedback', {
        feedbackText: trimmedFeedback,
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
      const isLengthError = error instanceof ApiRequestError
        && error.code === FEEDBACK_TEXT_TOO_LONG_CODE;

      toast({
        title: isLengthError ? "Feedback too long" : "Feedback did not send",
        description: isLengthError
          ? error.body?.message || FEEDBACK_TEXT_TOO_LONG_MESSAGE
          : "I couldn't send Feedback right now. Try again later.",
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
            onChange={(e) => setFeedback(e.target.value)}
            maxLength={FEEDBACK_TEXT_MAX_LENGTH}
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
