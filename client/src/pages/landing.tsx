import { useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Camera, ChefHat, Check, Clock, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { Badge } from "@/components/ui/badge";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import landingCookingGuidance from "@assets/landing-packaged-cartoon-cooking-guidance.jpg";
import landingKitchenScan from "@assets/landing-packaged-cartoon-kitchen-scan.jpg";
import landingRecipeBowl from "@assets/landing-packaged-cartoon-recipe-bowl.jpg";
import laicaLogo from "@assets/laica_logo_v1_cropped_1763444931884.png";

const journeySteps = [
  "Scan your kitchen for ingredients",
  "Pick a recipe",
  "Get live guidance to cook it",
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
  const journeyRef = useRef<HTMLDivElement>(null);
  const [activeJourneyStep, setActiveJourneyStep] = useState(0);

  const reveal = {
    hidden: { opacity: 0, y: motionEnabled ? 16 : 0 },
    show: { opacity: 1, y: 0 },
  };

  const updateActiveJourneyStep = () => {
    const container = journeyRef.current;
    if (!container) return;

    const slides = Array.from(container.querySelectorAll<HTMLElement>("[data-journey-slide]"));
    if (slides.length === 0) return;

    const containerLeft = container.getBoundingClientRect().left;
    const closestIndex = slides.reduce(
      (closest, slide, index) => {
        const distance = Math.abs(slide.getBoundingClientRect().left - containerLeft);
        return distance < closest.distance ? { index, distance } : closest;
      },
      { index: 0, distance: Number.POSITIVE_INFINITY },
    ).index;

    setActiveJourneyStep(closestIndex);
  };

  const scrollToJourneyStep = (index: number) => {
    const container = journeyRef.current;
    const slide = container?.querySelectorAll<HTMLElement>("[data-journey-slide]")[index];
    if (!slide) return;

    const containerRect = container.getBoundingClientRect();
    const slideRect = slide.getBoundingClientRect();

    setActiveJourneyStep(index);
    container.scrollTo({
      left: container.scrollLeft + slideRect.left - containerRect.left,
      behavior: motionEnabled ? "smooth" : "auto",
    });
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
                    {isLoading ? "Starting..." : "Start cooking now"}
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
            </motion.div>
          </div>

          <motion.div
            className="landing-journey-object"
            variants={reveal}
            transition={{ duration: 0.42, ease: "easeOut" }}
          >
            <div
              ref={journeyRef}
              className="landing-journey-scroll"
              onScroll={updateActiveJourneyStep}
              aria-label="How Laica turns pantry photos into cooking help"
            >
              <article className="landing-journey-slide landing-scan-slide" data-journey-slide aria-label="Step 1 of 3: Scan your kitchen for ingredients">
                <div className="landing-journey-header">
                  <h2>Scan your kitchen for ingredients</h2>
                </div>

                <div className="landing-camera-card">
                  <div className="landing-camera-topbar">
                    <span>
                      <Camera className="h-4 w-4" aria-hidden="true" />
                      Pantry camera
                    </span>
                    <span>Live preview</span>
                  </div>

                  <div className="landing-kitchen-viewfinder" aria-hidden="true">
                    <img src={landingKitchenScan} alt="" className="landing-kitchen-photo" />
                    <span className="landing-viewfinder-corner landing-viewfinder-corner-tl" />
                    <span className="landing-viewfinder-corner landing-viewfinder-corner-tr" />
                    <span className="landing-viewfinder-corner landing-viewfinder-corner-bl" />
                    <span className="landing-viewfinder-corner landing-viewfinder-corner-br" />
                    <ScanLine className="landing-kitchen-scan-icon" />
                  </div>
                </div>

                <div className="landing-extracted-panel">
                  <span className="landing-extracted-label">Found</span>
                  <div className="landing-extracted-chips" aria-label="Detected ingredients">
                    {["rice", "beef patties", "BBQ sauce", "eggs"].map((ingredient) => (
                      <span key={ingredient} className="landing-extracted-chip">
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        {ingredient}
                      </span>
                    ))}
                  </div>
                </div>
              </article>

              <article className="landing-journey-slide landing-recipe-slide" data-journey-slide aria-label="Step 2 of 3: Pick a recipe">
                <div className="landing-journey-header">
                  <h2>Pick a recipe</h2>
                </div>

                <div className="planning-ticket planning-ticket-large landing-recipe-demo-ticket" data-selected="true">
                  <span className="planning-ticket-rip" aria-hidden="true" />
                  <span className="planning-ticket-title">
                    <span className="planning-ticket-title-main">Pantry Loco Moco-style bowl</span>
                    <span className="planning-ticket-title-detail">Rice, beef patty, egg, and BBQ pan gravy.</span>
                  </span>
                  <span className="planning-recipe-image-slot" data-has-image="true" aria-hidden="true">
                    <img src={landingRecipeBowl} alt="" className="planning-recipe-image" />
                  </span>
                  <span className="planning-ticket-meta">
                    <span><Clock className="h-4 w-4" aria-hidden="true" /> 30 min</span>
                    <span>Medium</span>
                  </span>
                  <span className="planning-ticket-divider" />
                  <span className="planning-ticket-section">
                    <span className="planning-ticket-section-label">Uses</span>
                    <span className="planning-ticket-chip-row">
                      {["rice", "beef patties", "BBQ sauce", "eggs"].map((ingredient) => (
                        <Badge key={ingredient} variant="outline" className="planning-use-chip">
                          {ingredient}
                        </Badge>
                      ))}
                    </span>
                  </span>
                </div>

                <div className="landing-recipe-source-note">
                  <Check className="h-4 w-4" aria-hidden="true" />
                  <span>Picked from 17 ingredients in your kitchen. Laica highlights the ones this recipe uses.</span>
                </div>
              </article>

              <article className="landing-journey-slide landing-guidance-slide" data-journey-slide aria-label="Step 3 of 3: Get live guidance to cook it">
                <div className="landing-journey-header">
                  <h2>Get live guidance to cook it</h2>
                </div>

                <div className="landing-guidance-demo" aria-hidden="true">
                  <div className="landing-guidance-image-panel">
                    <img src={landingCookingGuidance} alt="" className="landing-guidance-photo" />
                  </div>

                  <div className="landing-guidance-panel">
                    <div className="landing-guidance-panel-top">
                      <span>Now cooking</span>
                      <span>Step 2</span>
                    </div>
                    <p className="landing-guidance-step">Brown the patty, then spoon the BBQ pan gravy over warm rice.</p>
                    <span className="landing-guidance-progress" aria-hidden="true">
                      <span className="landing-guidance-progress-fill" />
                    </span>
                    <div className="landing-guidance-checklist">
                      <span><Check className="h-3.5 w-3.5" aria-hidden="true" /> Rice is warm</span>
                      <span><Check className="h-3.5 w-3.5" aria-hidden="true" /> Sauce is glossy</span>
                      <span><Clock className="h-3.5 w-3.5" aria-hidden="true" /> Egg goes on last</span>
                    </div>
                    <div className="landing-guidance-tip">
                      <ChefHat className="h-4 w-4" aria-hidden="true" />
                      <span>Tip: loosen the sauce with a splash of water if it gets sticky.</span>
                    </div>
                  </div>
                </div>
              </article>
            </div>

            <div className="landing-journey-dots" aria-label="Homepage proof steps">
              {journeySteps.map((step, index) => (
                <button
                  key={step}
                  type="button"
                  className="landing-journey-dot"
                  data-active={activeJourneyStep === index}
                  aria-label={`Show step ${index + 1}: ${step}`}
                  aria-current={activeJourneyStep === index ? "step" : undefined}
                  onClick={() => scrollToJourneyStep(index)}
                />
              ))}
            </div>
          </motion.div>
        </motion.section>
      </div>
    </main>
  );
}
