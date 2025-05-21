import { Star, StarHalf } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    text: "I was spending over $400 a month on takeout. With CulinaryAI, I've cut that in half and actually enjoy cooking now!",
    name: "Sarah T.",
    location: "Seattle, WA",
    rating: 5
  },
  {
    id: 2,
    text: "The step-by-step guidance feels like having a chef right beside you. The automatic progression is my favorite feature.",
    name: "James L.",
    location: "Chicago, IL",
    rating: 5
  },
  {
    id: 3,
    text: "The grocery list feature has saved me so much time and reduced food waste. I love the budget suggestions too!",
    name: "Michelle K.",
    location: "Austin, TX",
    rating: 4.5
  }
];

export default function TestimonialSection() {
  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-2">What Our Users Say</h2>
        <p className="text-gray-500 max-w-2xl mx-auto mb-10">
          Join thousands of home cooks who are saving money and building confidence in the kitchen.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map(testimonial => (
            <div key={testimonial.id} className="bg-gray-50 p-6 rounded-xl">
              <div className="text-accent mb-3 flex justify-center">
                {[...Array(Math.floor(testimonial.rating))].map((_, i) => (
                  <Star key={i} className="fill-current" />
                ))}
                {testimonial.rating % 1 !== 0 && <StarHalf className="fill-current" />}
              </div>
              <p className="mb-4 text-gray-500">{testimonial.text}</p>
              <div>
                <p className="font-bold">{testimonial.name}</p>
                <p className="text-sm text-gray-500">{testimonial.location}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
