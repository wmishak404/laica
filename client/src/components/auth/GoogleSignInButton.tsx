import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { FirebaseAuthSetup } from './FirebaseAuthSetup';

interface GoogleSignInButtonProps {
  variant?: "default" | "outline";
  size?: "sm" | "lg";
  className?: string;
  onSuccess?: () => void;
  children?: React.ReactNode;
}

export function GoogleSignInButton({ 
  variant = "default", 
  size = "lg", 
  className = "",
  onSuccess,
  children
}: GoogleSignInButtonProps) {
  const { signInWithGoogle, isLoading } = useFirebaseAuth();
  const [showSetup, setShowSetup] = useState(false);

  const handleSignIn = async () => {
    try {
      // Detect mobile devices and use redirect instead of popup
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      await signInWithGoogle(!isMobile);
      onSuccess?.();
    } catch (error: any) {
      console.error('Sign-in failed:', error);
      
      // Show setup instructions for common configuration errors
      if (error.code === 'auth/unauthorized-domain' || error.code === 'auth/operation-not-allowed') {
        setShowSetup(true);
      }
    }
  };

  if (showSetup) {
    return <FirebaseAuthSetup />;
  }

  return (
    <Button 
      onClick={handleSignIn}
      disabled={isLoading}
      variant={variant}
      size={size}
      className={`flex items-center gap-2 ${className}`}
    >
      {isLoading && (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
      )}
      {isLoading ? 'Signing in...' : (children || 'Continue with Google')}
    </Button>
  );
}