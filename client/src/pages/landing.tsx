import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { ChefHat, ScanLine, UserRound } from "lucide-react";
import laicaLogo from "@assets/laica_logo_v1_cropped_1763444931884.png";

const helpItems = [
  {
    icon: UserRound,
    title: "Personalized Profiles",
    description: "Tell Laica how you cook so suggestions fit your skill, diet, and kitchen.",
  },
  {
    icon: ScanLine,
    title: "Smart Pantry Recognition",
    description: "Scan pantry or fridge photos and turn visible ingredients into an editable list.",
  },
  {
    icon: ChefHat,
    title: "Live Cooking Guidance",
    description: "Cook step by step with cues, timers, and answers while dinner is happening.",
  },
];

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

export default function Landing() {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  return (
    <main className="min-h-screen bg-sidebar text-sidebar-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-7 pb-8 pt-12">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <img src={laicaLogo} alt="Laica" className="mb-7 h-20 object-contain" />
          <h1 className="max-w-xs text-4xl font-semibold leading-tight">
            Welcome to Laica
          </h1>
          <p className="mt-3 text-lg text-sidebar-foreground/75">
            Your live cooking assistant
          </p>
        </div>

        <div className="space-y-5">
          <GoogleSignInButton className="h-14 w-full rounded-lg bg-accent text-lg font-semibold text-accent-foreground hover:bg-accent/90">
            <GoogleIcon />
            <span>Continue with Google</span>
          </GoogleSignInButton>

          <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
            <DialogTrigger asChild>
              <button className="mx-auto block text-sm text-sidebar-foreground/70 underline underline-offset-4">
                What can you help me do?
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-sm rounded-lg">
              <DialogHeader>
                <DialogTitle>Laica helps with dinner</DialogTitle>
                <DialogDescription>
                  A quick look at what the app can do once you sign in.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 pt-2">
                {helpItems.map((item) => (
                  <div key={item.title} className="flex items-start gap-3 rounded-lg border bg-card p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-card-foreground">{item.title}</p>
                      <p className="mt-1 text-sm leading-snug text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </main>
  );
}
