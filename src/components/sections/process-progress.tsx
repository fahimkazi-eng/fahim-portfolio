"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePrefersReducedMotion } from "@/components/animations/motion-primitives";
import { cn } from "@/lib/utils";

/* --------------------------------------------------------------------------
   ProcessProgress — scroll-linked progress for the six-step process strip.

   A hairline fills as the strip travels through the viewport, and the six
   stage nodes illuminate in sequence. Owns scaleX on the bar and
   opacity/background on the nodes only — the strip's own entrance animation
   is untouched. Reduced motion: static half-lit track, content unaffected.
   -------------------------------------------------------------------------- */

export function ProcessProgress({
  stages,
  children,
}: {
  stages: { index: string; label: string }[];
  children: ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const reduced = usePrefersReducedMotion();

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (reduced || !root) return;
    gsap.registerPlugin(ScrollTrigger);

    const bar = root.querySelector<HTMLElement>("[data-process-bar]");
    const nodes = Array.from(
      root.querySelectorAll<HTMLElement>("[data-process-node]"),
    );
    if (!bar || nodes.length === 0) return;

    const setNodes = (progress: number) => {
      const lit = Math.round(progress * nodes.length);
      nodes.forEach((node, i) => {
        node.dataset.lit = i < lit ? "true" : "false";
      });
    };

    const tween = gsap.fromTo(
      bar,
      { scaleX: 0 },
      {
        scaleX: 1,
        ease: "none",
        scrollTrigger: {
          trigger: root,
          start: "top 78%",
          end: "bottom 42%",
          scrub: 0.5,
          onUpdate: (self) => setNodes(self.progress),
        },
      },
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [reduced]);

  return (
    <div ref={rootRef}>
      {/* Progress rail — decorative, hidden from assistive tech */}
      <div
        aria-hidden="true"
        className="mb-5 flex items-center gap-3"
      >
        <div className="relative h-px flex-1 bg-line">
          <div
            data-process-bar
            className="absolute inset-0 origin-left bg-gradient-to-r from-signal-400 via-violet-400 to-pulse-300"
            style={reduced ? { transform: "scaleX(0.5)" } : undefined}
          />
        </div>
        <div className="flex items-center gap-2">
          {stages.map((stage) => (
            <span
              key={stage.index}
              data-process-node
              title={stage.label}
              className={cn(
                "size-1.5 rounded-full transition-colors duration-500",
                "bg-line-strong data-[lit=true]:bg-accent data-[lit=true]:shadow-[0_0_10px_2px_color-mix(in_oklab,var(--color-signal-500)_50%,transparent)]",
              )}
            />
          ))}
        </div>
      </div>
      {children}
    </div>
  );
}
