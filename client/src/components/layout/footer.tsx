import { Link } from 'wouter';
import { UtensilsCrossed } from 'lucide-react';
import { Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#2D3436] py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <UtensilsCrossed className="h-8 w-8 text-primary" />
              <h3 className="ml-2 text-xl font-bold text-white">LAICA</h3>
            </div>
            <p className="text-white/70 mb-4">
              Your AI-powered cooking assistant that makes home cooking easy, fun, and affordable.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-white/70 hover:text-primary transition">
                <Facebook size={18} />
              </a>
              <a href="#" className="text-white/70 hover:text-primary transition">
                <Twitter size={18} />
              </a>
              <a href="#" className="text-white/70 hover:text-primary transition">
                <Instagram size={18} />
              </a>
              <a href="#" className="text-white/70 hover:text-primary transition">
                <Linkedin size={18} />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-4">Features</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/recipes">
                  <a className="text-white/70 hover:text-primary transition">Meal Planning</a>
                </Link>
              </li>
              <li>
                <Link href="/cooking">
                  <a className="text-white/70 hover:text-primary transition">Cooking Guidance</a>
                </Link>
              </li>
              <li>
                <Link href="/grocery-list">
                  <a className="text-white/70 hover:text-primary transition">Grocery Lists</a>
                </Link>
              </li>
              <li>
                <Link href="/recipes">
                  <a className="text-white/70 hover:text-primary transition">Recipe Database</a>
                </Link>
              </li>
              <li>
                <a href="#" className="text-white/70 hover:text-primary transition">Visual Recognition</a>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-4">Resources</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-white/70 hover:text-primary transition">Cooking Basics</a></li>
              <li><a href="#" className="text-white/70 hover:text-primary transition">Recipe Collections</a></li>
              <li><a href="#" className="text-white/70 hover:text-primary transition">Budget Cooking</a></li>
              <li><a href="#" className="text-white/70 hover:text-primary transition">Kitchen Setup</a></li>
              <li><a href="#" className="text-white/70 hover:text-primary transition">FAQ</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-4">Company</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-white/70 hover:text-primary transition">About Us</a></li>
              <li><a href="#" className="text-white/70 hover:text-primary transition">Careers</a></li>
              <li><a href="#" className="text-white/70 hover:text-primary transition">Press</a></li>
              <li><a href="#" className="text-white/70 hover:text-primary transition">Contact</a></li>
              <li><a href="#" className="text-white/70 hover:text-primary transition">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/20 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-white/70 text-sm mb-4 md:mb-0">© {new Date().getFullYear()} LAICA. All rights reserved.</p>
          <div className="flex space-x-6">
            <a href="#" className="text-white/70 text-sm hover:text-primary transition">Terms of Service</a>
            <a href="#" className="text-white/70 text-sm hover:text-primary transition">Privacy Policy</a>
            <a href="#" className="text-white/70 text-sm hover:text-primary transition">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
