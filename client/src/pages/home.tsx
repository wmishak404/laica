import HeroSection from '@/components/home/hero-section';
import FeaturesSection from '@/components/home/features-section';
import RecipeSection from '@/components/home/recipe-section';
import CookingDemo from '@/components/home/cooking-demo';
import TestimonialSection from '@/components/home/testimonial-section';
import CTASection from '@/components/home/cta-section';
import Footer from '@/components/layout/footer';

export default function Home() {
  return (
    <>
      <main>
        <HeroSection />
        <FeaturesSection />
        <RecipeSection />
        <CookingDemo />
        <TestimonialSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
