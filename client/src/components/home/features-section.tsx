import { Lightbulb, ClipboardCheck, Camera } from 'lucide-react';

export default function FeaturesSection() {
  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">How CulinaryAI Helps You Cook</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gray-50 rounded-xl p-6 transition hover:shadow-md">
            <div className="bg-primary/10 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
              <Lightbulb className="text-primary text-xl" />
            </div>
            <h3 className="text-xl font-bold mb-2">Smart Recipe Suggestions</h3>
            <p className="text-gray-500">Get personalized meal ideas based on your preferences, dietary needs, and available ingredients.</p>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-6 transition hover:shadow-md">
            <div className="bg-secondary/10 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
              <ClipboardCheck className="text-secondary text-xl" />
            </div>
            <h3 className="text-xl font-bold mb-2">Automated Grocery Lists</h3>
            <p className="text-gray-500">Automatically generate shopping lists with ingredient alternatives that match your budget and preferences.</p>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-6 transition hover:shadow-md">
            <div className="bg-accent/20 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
              <Camera className="text-accent text-xl" />
            </div>
            <h3 className="text-xl font-bold mb-2">Visual Cooking Guidance</h3>
            <p className="text-gray-500">Real-time feedback on your cooking progress with smart step tracking that advances automatically.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
