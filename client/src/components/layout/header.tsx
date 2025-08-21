import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UtensilsCrossed, Search, Menu, X, Settings, LogOut, User, MessageSquare } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import FeedbackButton from '@/components/feedback/FeedbackButton';
import { usePageName } from '@/hooks/usePageName';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const pageName = usePageName();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = async () => {
    try {
      console.log('Logging out with Google/Firebase authentication');
      
      // Import and use the Firebase auth hook
      const { useFirebaseAuth } = await import('@/hooks/useFirebaseAuth');
      
      // We can't use the hook directly here, so use the service
      const { FirebaseAuthService } = await import('@/lib/firebase');
      await FirebaseAuthService.signOut();
      
      console.log('Firebase logout successful - redirecting to home');
      
      // Clear any cached data and redirect
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if logout fails
      window.location.href = '/';
    }
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    
    // Check if it's an AuthUser (external auth)
    if ('firstName' in user && 'lastName' in user) {
      const firstName = user.firstName;
      const lastName = user.lastName;
      if (firstName && lastName) {
        return `${firstName[0]}${lastName[0]}`;
      }
    }
    
    // Check if it's a User (local auth)
    if ('username' in user) {
      const username = user.username;
      if (username) {
        return username[0].toUpperCase();
      }
    }
    
    // Fall back to email for both types
    const email = user.email;
    if (email) {
      return email[0].toUpperCase();
    }
    
    return 'U';
  };

  const getUserDisplayName = () => {
    if (!user) return 'User';
    
    // Check if it's an AuthUser (external auth)
    if ('firstName' in user && 'lastName' in user) {
      const firstName = user.firstName;
      const lastName = user.lastName;
      if (firstName && lastName) {
        return `${firstName} ${lastName}`;
      }
    }
    
    // Check if it's a User (local auth)
    if ('username' in user) {
      const username = user.username;
      if (username) {
        return username;
      }
    }
    
    // Fall back to email for both types
    const email = user.email;
    if (email) {
      return email;
    }
    
    return 'User';
  };

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 shadow-sm border-b border-gray-100 dark:border-gray-800">
      <div className="w-full px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <UtensilsCrossed className="h-7 w-7 text-primary" />
          <Link href="/">
            <h1 className="ml-2 text-xl md:text-2xl font-bold text-primary cursor-pointer">Cooking Assistant</h1>
          </Link>
        </div>

        <nav className={`md:flex space-x-6 ${isMenuOpen 
          ? 'absolute top-14 right-4 bg-white dark:bg-gray-900 p-4 shadow-xl rounded-lg flex-col space-y-4 z-50 border dark:border-gray-700' 
          : 'hidden'}`}
        >
          <Link href="/">
            <a className={`text-foreground hover:text-primary transition font-medium ${location === '/' ? 'text-primary' : ''}`}>
              Home
            </a>
          </Link>
          <Link href="/cooking">
            <a className={`text-foreground hover:text-primary transition font-medium ${location === '/cooking' ? 'text-primary' : ''}`}>
              Start Cooking
            </a>
          </Link>
          <Link href="/recipes">
            <a className={`text-foreground hover:text-primary transition font-medium ${location === '/recipes' ? 'text-primary' : ''}`}>
              Recipes
            </a>
          </Link>
          <Link href="/grocery-list">
            <a className={`text-foreground hover:text-primary transition font-medium ${location === '/grocery-list' ? 'text-primary' : ''}`}>
              Grocery List
            </a>
          </Link>
          <FeedbackButton 
            pageName={pageName} 
            variant="ghost" 
            className="text-foreground hover:text-primary transition font-medium p-0 h-auto"
          >
            Feedback
          </FeedbackButton>
        </nav>

        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden" 
            onClick={toggleMenu}
          >
            {isMenuOpen ? <X className="h-5 w-5 text-foreground" /> : <Menu className="h-5 w-5 text-foreground" />}
          </Button>

          {!isLoading && isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user && 'profileImageUrl' in user ? user.profileImageUrl || undefined : undefined} alt={getUserDisplayName()} />
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{getUserDisplayName()}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email || 'No email'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/settings">
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:block">
              <Link href="/login">
                <Button className="ml-4 bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-full transition">
                  Sign In
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
