"use client";

/* ==========================================================================
   CinematicIntro — the homepage opening scene.

   One held, viewport-sized stage sits on top of the portfolio and plays four
   acts as the visitor scrolls. The stage is a single element: the acts are
   layers inside it, so the last act is a real `clip-path` reveal of the
   portfolio underneath — not a stack of full-screen sections.

   | act        | progress   | what happens                                   |
   | ---------- | ---------- | ---------------------------------------------- |
   | Horizon    | 0 → 0.36   | the /horizon cosmos and its opening panel       |
   | Aircraft   | 0.36 → 0.6 | the plane crosses the CTA type                   |
   | Reveal     | 0.6 → 0.8  | the stage clip-paths away, uncovering the site   |
   | Tail       | 0.8 → 1.0  | the portfolio is fully in place                  |

   Geometry
   --------
   The spacer is 500svh and the stage is `sticky` inside it, so the stage holds
   for 400svh. The content is offset by -100svh, which puts its top edge exactly
   at 400svh — i.e. under the stage's bottom edge, and on screen, at the moment
   the sticky releases. Clipping the stage from the bottom at the same rate
   therefore lines the reveal's leading edge up with the content's rising top
   edge, with no gap and no jump. The stage is `pointer-events-none`, so it
   never intercepts a click even while visible.

   Motion
   ------
   One ScrollTrigger owns progress and writes it into the Horizon scene and a
   framer-motion value for the plane. Those read from the same GSAP ticker
   Lenis drives (MOTION.md): no second scroll listener, no per-frame React
   state. Reduced motion and no-JS remove the whole scene in CSS instead
   (globals.css), so those visitors land straight on the portfolio.
   ========================================================================== */

import dynamic from "next/dynamic";
import { useLayoutEffect, useRef, type ReactNode } from "react";
import { useMotionValue } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowDown } from "lucide-react";
import { usePrefersReducedMotion } from "@/components/animations/motion-primitives";
import { ScrollFlyIn } from "@/components/ui/hero-section-3";
import { INTRO_COPY } from "@/lib/horizon";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

/* The WebGL scene is client-only and heavy: mount it after hydration, and
   never on the server. */
const HorizonStage = dynamic(
  () => import("@/components/ui/horizon-hero-section"),
  { ssr: false, loading: () => null },
);

/** Scroll length of the whole opening scene, in small-viewport heights. */
const INTRO_HEIGHT = "500svh";
/** Progress at which each act hands over to the next. */
const HORIZON_END = 0.36;
const PLANE_START = 0.36;
const PLANE_END = 0.6;
const REVEAL_START = 0.6;
const REVEAL_END = 0.8;

function clamp01(value: number) {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

export function CinematicIntro({ children }: { children: ReactNode }) {
  const reduced = usePrefersReducedMotion();
  const spacerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);

  /* Progress handed to the WebGL scene (object ref: the scene reads it from
     the ticker, so it must not be a React state). */
  const horizonProgress = useRef({ progress: 0 });
  /* Progress handed to the plane, read by framer-motion's transform. */
  const planeProgress = useMotionValue(0);

  useLayoutEffect(() => {
    if (reduced) return;
    const spacer = spacerRef.current;
    const stage = stageRef.current;
    if (!spacer || !stage) return;

    const apply = (progress: number) => {
      horizonProgress.current.progress = clamp01(progress / HORIZON_END);

      planeProgress.set(
        clamp01((progress - PLANE_START) / (PLANE_END - PLANE_START)),
      );

      /* Real mask reveal: the stage is clipped from the bottom edge in step
         with the content's top edge (see the geometry note above). */
      const reveal = clamp01(
        (progress - REVEAL_START) / (REVEAL_END - REVEAL_START),
      );
      stage.style.clipPath = `inset(0px 0px ${(reveal * 100).toFixed(3)}% 0px)`;

      /* The call fades in as the aircraft arrives and is gone before the
         reveal finishes, so the two acts never fight for attention. */
      const cta =
        clamp01((progress - 0.34) / 0.08) *
        (1 - clamp01((progress - 0.55) / 0.1));
      if (ctaRef.current) ctaRef.current.style.opacity = cta.toFixed(3);
      if (scrimRef.current) scrimRef.current.style.opacity = cta.toFixed(3);
    };

    apply(0);

    const trigger = ScrollTrigger.create({
      trigger: spacer,
      start: "top top",
      end: "bottom top",
      invalidateOnRefresh: true,
      onUpdate: (self) => apply(self.progress),
      onRefresh: (self) => apply(self.progress),
    });

    return () => trigger.kill();
    /* planeProgress is a stable MotionValue; horizonProgress and the refs are
       stable too, so this effect only re-runs if the preference flips. */
  }, [reduced, planeProgress]);

  /* Reduced motion: no scene, no spacer, no offset — the portfolio is simply
     the page. CSS covers the pre-hydration frame (globals.css). */
  if (reduced) return <>{children}</>;

  return (
    <>
      {/* No JS at all: the scene can never animate, so remove it and let the
          portfolio start at the top. */}
      <noscript>
        <style>{`[data-intro]{display:none !important}[data-intro-content]{margin-top:0 !important}`}</style>
      </noscript>

      <div
        ref={spacerRef}
        data-intro
        aria-hidden="true"
        className="relative w-full"
        style={{ height: INTRO_HEIGHT }}
      >
        <div
          ref={stageRef}
          className="pointer-events-none sticky top-0 z-40 h-svh w-full overflow-hidden bg-canvas"
        >
          {/* Act 1 — the /horizon cosmos, held. Reuses the exact scene the
              standalone route renders, in `stage` mode. */}
          <HorizonStage
            variant="stage"
            progressRef={horizonProgress}
            className="absolute inset-0 z-0"
          />

          {/* Readability scrim: sits over the cosmos, under the CTA type, and
              only while the aircraft act is on screen. */}
          <div
            ref={scrimRef}
            aria-hidden="true"
            className="absolute inset-0 z-10 bg-[radial-gradient(80%_60%_at_50%_55%,rgba(0,0,0,0.55),rgba(0,0,0,0.8))] opacity-0"
          />

          {/* Acts 2–3 — the aircraft crossing the call to action. */}
          <ScrollFlyIn
            progress={planeProgress}
            imageUrl="/intro/plane.webp"
            imageAlt=""
            className="absolute inset-0 z-20"
          >
            <div
              ref={ctaRef}
              className="flex flex-col items-center px-6 opacity-0"
            >
              <span className="type-mono text-fg-subtle">
                {INTRO_COPY.eyebrow}
              </span>
              <h2 className="mt-4 font-display text-[clamp(2.25rem,9vw,7rem)] leading-[0.95] font-bold tracking-tight text-ember uppercase">
                {INTRO_COPY.heading}
              </h2>
              <p className="mt-5 max-w-[34ch] text-lead text-fg-muted">
                {INTRO_COPY.supporting}
              </p>
              <span
                className={cn(
                  "type-mono mt-10 inline-flex flex-col items-center gap-3 text-fg-subtle",
                )}
              >
                {INTRO_COPY.prompt}
                <ArrowDown aria-hidden="true" className="size-4 animate-bounce" />
              </span>
            </div>
          </ScrollFlyIn>
        </div>
      </div>

      {/* The real portfolio. Pulled up one viewport so its top edge meets the
          stage's bottom edge exactly when the reveal begins. */}
      <div data-intro-content className="relative z-10 -mt-[100svh]">
        {children}
      </div>
    </>
  );
}
