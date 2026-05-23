import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Camera, ChefHat, Clock, Mic2, ScanLine, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import laicaLogo from "@assets/laica_logo_v1_cropped_1763444931884.png";

const pantryChips = ["eggs", "rice", "hot sauce"];

const proofCards = [
  {
    icon: Utensils,
    title: "Recipe ideas",
    copy: "Dinner options shaped around pantry facts, time, and taste.",
  },
  {
    icon: Camera,
    title: "Pantry scan",
    copy: "Photos become an editable list of ingredients Laica can cook with.",
  },
  {
    icon: Mic2,
    title: "Cooking guidance",
    copy: "Step cues, substitutions, and timers stay nearby while you cook.",
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
  const { signInAsGuest, isLoading } = useFirebaseAuth();
  const prefersReducedMotion = useReducedMotion();
  const motionEnabled = !prefersReducedMotion;

  const reveal = {
    hidden: { opacity: 0, y: motionEnabled ? 16 : 0 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <main className="landing-ui min-h-screen overflow-hidden">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-7 pt-8 md:max-w-5xl md:px-8">
        <motion.section
          className="flex flex-1 flex-col justify-center gap-8 py-4 md:grid md:grid-cols-[0.95fr_1.05fr] md:items-center md:gap-10"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: {
              transition: {
                staggerChildren: motionEnabled ? 0.08 : 0,
              },
            },
          }}
        >
          <div className="space-y-6">
            <motion.img
              src={laicaLogo}
              alt="Laica"
              className="h-12 w-auto object-contain md:h-14"
              variants={reveal}
              transition={{ duration: 0.36, ease: "easeOut" }}
            />

            <motion.div className="space-y-4" variants={reveal} transition={{ duration: 0.36, ease: "easeOut" }}>
              <h1 className="setup-display text-[3rem] font-extrabold leading-[0.96] tracking-normal text-[hsl(var(--setup-ink))] md:text-[4.5rem]">
                Cook from what you already have.
              </h1>
              <p className="max-w-sm text-base font-bold leading-relaxed text-[hsl(var(--setup-ink)/0.68)] md:text-lg">
                Show Laica your pantry, get dinner ideas that fit your real kitchen, then cook with cues when you need them.
              </p>
            </motion.div>

            <motion.div className="max-w-md space-y-3" variants={reveal} transition={{ duration: 0.34, ease: "easeOut" }}>
              <div className="grid grid-cols-1 gap-3">
                <motion.div whileTap={motionEnabled ? { scale: 0.98 } : undefined}>
                  <Button
                    type="button"
                    size="lg"
                    onClick={signInAsGuest}
                    disabled={isLoading}
                    className="h-14 w-full rounded-full text-base font-extrabold shadow-lg shadow-primary/20"
                  >
                    <ChefHat className="h-5 w-5" aria-hidden="true" />
                    {isLoading ? "Starting..." : "Let's cook!"}
                    <ArrowRight className="h-5 w-5" aria-hidden="true" />
                  </Button>
                </motion.div>

                <motion.div whileTap={motionEnabled ? { scale: 0.98 } : undefined}>
                  <GoogleSignInButton
                    variant="outline"
                    className="h-14 w-full rounded-full border-2 px-5 text-base font-extrabold"
                  >
                    <GoogleIcon />
                    <span className="min-w-0 whitespace-nowrap">Continue with Google</span>
                  </GoogleSignInButton>
                </motion.div>
              </div>
              <p className="text-center text-sm font-bold text-[hsl(var(--setup-ink)/0.56)] sm:text-left">
                Try Laica first, or link Google when you want a kitchen that follows you.
              </p>
            </motion.div>
          </div>

          <motion.div
            className="landing-demo-object"
            variants={reveal}
            transition={{ duration: 0.42, ease: "easeOut" }}
          >
            <div className="landing-scan-panel">
              <div className="landing-scan-main">
                <div className="landing-scan-frame" aria-hidden="true">
                  <ScanLine className="h-12 w-12 text-accent" />
                </div>
                <p className="landing-scan-caption">Pantry clues become dinner.</p>
              </div>
              <div className="space-y-3">
                {pantryChips.map((chip, index) => (
                  <motion.span
                    key={chip}
                    className="landing-pantry-chip"
                    initial={motionEnabled ? { opacity: 0, scale: 0.86, y: 8 } : false}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: motionEnabled ? 0.35 + index * 0.08 : 0, duration: 0.2, ease: "easeOut" }}
                  >
                    {chip}
                  </motion.span>
                ))}
              </div>
            </div>

            <div className="grid gap-3">
              <div className="landing-recipe-ticket">
                <div>
                  <p className="text-xs font-black text-primary">Tonight</p>
                  <h2 className="mt-2 text-xl font-extrabold leading-tight text-[hsl(var(--setup-ink))]">
                    Soy butter mushroom noodles
                  </h2>
                </div>
                <div className="landing-ticket-meta">
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  <span>30 min</span>
                </div>
              </div>

              {proofCards.map((card, index) => (
                <motion.article
                  key={card.title}
                  className="landing-proof-card"
                  initial={motionEnabled ? { opacity: 0, y: 18 } : false}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.45 }}
                  transition={{ delay: motionEnabled ? index * 0.06 : 0, duration: 0.28, ease: "easeOut" }}
                >
                  <span className="landing-proof-icon">
                    <card.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-base font-extrabold text-[hsl(var(--setup-ink))]">{card.title}</span>
                    <span className="mt-1 block text-sm font-bold leading-snug text-[hsl(var(--setup-ink)/0.62)]">{card.copy}</span>
                  </span>
                </motion.article>
              ))}
            </div>
          </motion.div>
        </motion.section>
      </div>
    </main>
  );
}
