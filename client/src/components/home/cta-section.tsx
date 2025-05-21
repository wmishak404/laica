import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

export default function CTASection() {
  return (
    <section className="py-12 md:py-16 bg-gradient-to-r from-primary to-secondary">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
          Ready to Transform Your Cooking Experience?
        </h2>
        <p className="text-white/90 max-w-2xl mx-auto mb-8 text-lg">
          Join CulinaryAI today and start cooking with confidence. Your personal AI chef is just a click away.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/cooking">
            <Button className="bg-white text-primary hover:bg-opacity-90 px-8 py-3 rounded-full font-semibold transition text-lg">
              Get Started Free
            </Button>
          </Link>
          <Button variant="outline" className="bg-transparent border-2 border-white text-white hover:bg-white/10 px-8 py-3 rounded-full font-semibold transition text-lg">
            See Plans
          </Button>
        </div>
        
        <p className="text-white/80 mt-6 text-sm">No credit card required • Free 7-day trial</p>
      </div>
    </section>
  );
}
