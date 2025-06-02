import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { UtensilsCrossed, Search, Menu, X } from 'lucide-react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
      <div className="w-full px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <UtensilsCrossed className="h-7 w-7 text-primary" />
          <Link href="/">
            <h1 className="ml-2 text-xl md:text-2xl font-bold text-primary cursor-pointer">LAICA</h1>
          </Link>
        </div>

        <nav className={`md:flex space-x-6 ${isMenuOpen 
          ? 'absolute top-14 right-4 bg-white p-4 shadow-xl rounded-lg flex-col space-y-4 z-50 border' 
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
        </nav>

        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden" 
            onClick={toggleMenu}
          >
            {isMenuOpen ? <X className="h-5 w-5 text-foreground" /> : <Menu className="h-5 w-5 text-foreground" />}
          </Button>
          <div className="hidden md:block">
            <Link href="/cooking">
              <Button className="ml-4 bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-full transition">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
