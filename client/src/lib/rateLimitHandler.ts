// Rate limit and error handling for demo mode
import { toast } from '@/hooks/use-toast';

export function isRateLimitError(error: Error): boolean {
  const message = error.message.toLowerCase();
  return message.includes('rate limit') || 
         message.includes('quota') || 
         message.includes('429') ||
         message.includes('too many requests');
}

export function isAPIError(error: Error): boolean {
  const message = error.message.toLowerCase();
  return message.includes('api') || 
         message.includes('openai') || 
         message.includes('elevenlabs') ||
         message.includes('500') ||
         message.includes('502') ||
         message.includes('503');
}

export function handleDemoLimitReached(): void {
  // Show toast notification
  toast({
    title: "Demo Limit Reached",
    description: "You've reached the demo usage limit. Redirecting to home page...",
    variant: "default",
  });

  // Redirect to home page after a brief delay
  setTimeout(() => {
    window.location.href = "/";
  }, 2000);
}

export function handleAPIError(error: Error, context: string = ''): void {
  console.error(`API Error in ${context}:`, error);
  
  if (isRateLimitError(error)) {
    handleDemoLimitReached();
    return;
  }

  // For other API errors, show a generic message but don't redirect
  toast({
    title: "Service Temporarily Unavailable",
    description: "Please try again in a moment. If the issue persists, you may have reached the demo limit.",
    variant: "destructive",
  });
}

// Wrapper for API calls with automatic error handling
export async function withDemoErrorHandling<T>(
  apiCall: () => Promise<T>,
  context: string = ''
): Promise<T | null> {
  try {
    return await apiCall();
  } catch (error) {
    handleAPIError(error as Error, context);
    return null;
  }
}