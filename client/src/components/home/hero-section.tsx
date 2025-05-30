import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

export default function HeroSection() {
  return (
    <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-12 md:py-20">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-8 md:mb-0 md:pr-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              Your AI-Powered <span className="text-primary">Cooking Assistant</span>
            </h1>
            <p className="text-xl mb-6">
              Learn to cook with step-by-step AI guidance, smart meal planning, and personalized grocery lists.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/cooking">
                <Button className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-full font-semibold transition">
                  Start Cooking
                </Button>
              </Link>
              <Link href="/recipes">
                <Button variant="outline" className="border-2 border-primary text-primary hover:bg-primary/5 px-6 py-3 rounded-full font-semibold transition">
                  Explore Recipes
                </Button>
              </Link>
            </div>
          </div>
          <div className="md:w-1/2 relative">
            <img 
              src="https://images.unsplash.com/photo-1507048331197-7d4ac70811cf?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600" 
              alt="Home cooking with smartphone guidance" 
              className="rounded-xl shadow-lg w-full h-auto" 
            />
            <div className="absolute -bottom-4 -left-4 bg-white p-3 rounded-lg shadow-md border-l-4 border-secondary hidden md:block">
              <p className="text-sm font-semibold">LAICA detected:</p>
              <p className="text-xs">Using up pantry ingredients for a quick meal</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
