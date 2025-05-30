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
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <UtensilsCrossed className="h-8 w-8 text-primary" />
          <Link href="/">
            <h1 className="ml-2 text-2xl font-bold text-primary cursor-pointer">LAICA</h1>
          </Link>
        </div>

        <nav className={`md:flex space-x-6 ${isMenuOpen 
          ? 'absolute top-16 right-4 bg-white p-4 shadow-lg rounded-lg flex-col space-y-4 z-50' 
          : 'hidden'}`}
        >
          <Link href="/">
            <a className={`text-foreground hover:text-primary transition ${location === '/' ? 'text-primary' : ''}`}>
              Home
            </a>
          </Link>
          <Link href="/cooking">
            <a className={`text-foreground hover:text-primary transition ${location === '/cooking' ? 'text-primary' : ''}`}>
              Start Cooking
            </a>
          </Link>
        </nav>

        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="mr-2">
            <Search className="h-5 w-5 text-foreground" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden" 
            onClick={toggleMenu}
          >
            {isMenuOpen ? <X className="h-5 w-5 text-foreground" /> : <Menu className="h-5 w-5 text-foreground" />}
          </Button>
          <div className="hidden md:block">
            <Button className="ml-4 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-full transition">
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
