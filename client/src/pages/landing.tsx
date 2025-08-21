import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChefHat, Users, Clock, Smartphone, Camera } from "lucide-react";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="px-4 lg:px-6 h-14 flex items-center border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="flex items-center justify-center">
          <ChefHat className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          <span className="ml-2 text-lg font-bold text-gray-900 dark:text-white">Laica Cooking Assistant</span>
        </div>
        <div className="ml-auto">
          <GoogleSignInButton 
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            Try Demo
          </GoogleSignInButton>
        </div>
      </header>

      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl text-gray-900 dark:text-white">
                Your Personal
                <span className="text-orange-600 dark:text-orange-400"> Cooking Assistant</span>
              </h1>
              <p className="mx-auto max-w-[700px] text-gray-600 dark:text-gray-300 md:text-xl">
                Transform your cooking experience with intelligent meal planning, real-time guidance, 
                and personalized recipe recommendations tailored to your preferences and pantry.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <GoogleSignInButton 
                size="lg"
                className="bg-orange-600 hover:bg-orange-700 text-white min-w-[240px]"
              >
                Try Demo
              </GoogleSignInButton>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-12 md:py-24 bg-white dark:bg-gray-800">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-gray-900 dark:text-white">
              Everything You Need to Cook Better
            </h2>
            <p className="mt-4 text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              From meal planning to live cooking guidance, our AI assistant helps you every step of the way.
            </p>
          </div>
          
          <div className="grid gap-6 lg:grid-cols-3 lg:gap-12">
            <Card className="border-orange-200 dark:border-orange-800">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <CardTitle className="text-gray-900 dark:text-white">Personalized Profiles</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  Create detailed cooking profiles based on your skill level, dietary restrictions, and preferences.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-orange-200 dark:border-orange-800">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900 flex items-center justify-center mb-4">
                  <Camera className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <CardTitle className="text-gray-900 dark:text-white">Smart Pantry Recognition</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  Upload photos of your pantry and kitchen equipment for smart ingredient recognition.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-orange-200 dark:border-orange-800">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900 flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <CardTitle className="text-gray-900 dark:text-white">Live Cooking Guidance</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  Get real-time assistance and tips while cooking with our interactive step-by-step guidance.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>



      {/* CTA Section */}
      <section className="w-full py-12 md:py-24">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-gray-900 dark:text-white">
                Ready to Transform Your Cooking?
              </h2>
              <p className="mx-auto max-w-[600px] text-gray-600 dark:text-gray-300 md:text-xl">
                Join thousands of home cooks who have already improved their culinary skills with our AI assistant.
              </p>
            </div>
            <GoogleSignInButton 
              size="lg"
              className="bg-orange-600 hover:bg-orange-700 text-white min-w-[200px]"
            />
          </div>
        </div>
      </section>



      {/* Footer */}
      <footer className="border-t bg-white dark:bg-gray-800">
        <div className="container px-4 md:px-6 py-8 mx-auto">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center">
              <ChefHat className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              <span className="ml-2 text-lg font-bold text-gray-900 dark:text-white">Laica Cooking Assistant</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              © 2024 Laica Cooking Assistant. Enhancing your culinary journey with intelligent cooking guidance.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}