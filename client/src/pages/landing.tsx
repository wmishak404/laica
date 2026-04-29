import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { ChefHat, ScanLine, UserRound } from "lucide-react";
import laicaLogo from "@assets/laica_logo_v1_cropped_1763444931884.png";

const helpItems = [
  {
    icon: UserRound,
    title: "Personalized Profiles",
  },
  {
    icon: ScanLine,
    title: "Smart Pantry Recognition",
  },
  {
    icon: ChefHat,
    title: "Live Cooking Guidance",
  },
];

export default function Landing() {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  return (
    <main className="min-h-screen bg-sidebar text-sidebar-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-7 pb-8 pt-12">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="mb-10 rounded-[2rem] bg-accent/80 p-7 shadow-2xl shadow-black/20">
            <img src={laicaLogo} alt="Laica" className="h-24 w-24 object-contain" />
          </div>

          <img src={laicaLogo} alt="Laica" className="mb-5 h-16 object-contain" />
          <h1 className="max-w-xs text-4xl font-semibold leading-tight">
            Welcome to Laica
          </h1>
          <p className="mt-3 text-lg text-sidebar-foreground/75">
            Your live cooking assistant
          </p>
        </div>

        <div className="space-y-5">
          <GoogleSignInButton className="h-14 w-full rounded-lg bg-accent text-lg font-semibold text-accent-foreground hover:bg-accent/90">
            Continue with Google
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
                  <div key={item.title} className="flex items-center gap-3 rounded-lg border bg-card p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <span className="font-medium text-card-foreground">{item.title}</span>
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
