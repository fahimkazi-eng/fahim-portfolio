"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePrefersReducedMotion } from "@/components/animations/motion-primitives";

/* --------------------------------------------------------------------------
   JourneySpine — scroll-drawn connecting path for the identity arc.

   Mobile shows a vertical spine (the list's left border); desktop shows a
   horizontal rule (the per-item top borders). Two gradient fills — one per
   orientation, each visible only in its layout — scrub with the same
   trigger, and milestone nodes illuminate in sequence. Owns scale on the
   fills and data-lit on the nodes only. Reduced motion: static track.
   -------------------------------------------------------------------------- */

export function JourneySpine({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const reduced = usePrefersReducedMotion();

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (reduced || !root) return;
    gsap.registerPlugin(ScrollTrigger);

    const fillsY = Array.from(
      root.querySelectorAll<HTMLElement>("[data-journey-fill-y]"),
    );
    const fillsX = Array.from(
      root.querySelectorAll<HTMLElement>("[data-journey-fill-x]"),
    );
    const nodes = Array.from(
      root.querySelectorAll<HTMLElement>("[data-journey-node]"),
    );
    if (fillsY.length === 0 || fillsX.length === 0 || nodes.length === 0)
      return;

    const setNodes = (progress: number) => {
      const lit = Math.min(
        nodes.length,
        Math.floor(progress * (nodes.length + 1)),
      );
      nodes.forEach((node, i) => {
        node.dataset.lit = i < lit ? "true" : "false";
      });
    };

    const trigger = {
      trigger: root,
      start: "top 76%",
      end: "bottom 48%",
      scrub: 0.5,
      onUpdate: (self: { progress: number }) => setNodes(self.progress),
    } as const;

    const tweenY = gsap.fromTo(
      fillsY,
      { scaleY: 0 },
      { scaleY: 1, ease: "none", scrollTrigger: trigger },
    );
    const tweenX = gsap.fromTo(
      fillsX,
      { scaleX: 0 },
      { scaleX: 1, ease: "none", scrollTrigger: { ...trigger } },
    );

    return () => {
      tweenY.scrollTrigger?.kill();
      tweenY.kill();
      tweenX.scrollTrigger?.kill();
      tweenX.kill();
    };
  }, [reduced]);

  return (
    <div ref={rootRef} className="relative">
      {/* Mobile spine fill (the ol's own left border is the track) */}
      <div
        aria-hidden="true"
        className="absolute bottom-2 left-0 top-2 w-px bg-transparent md:hidden"
      >
        <div
          data-journey-fill-y
          className="h-full w-full origin-top bg-gradient-to-b from-signal-400 via-violet-400 to-pulse-300"
        />
      </div>
      {/* Desktop rule fill */}
      <div
        aria-hidden="true"
        className="absolute left-0 right-0 top-0 hidden h-px md:block"
      >
        <div
          data-journey-fill-x
          className="h-full w-full origin-left bg-gradient-to-r from-signal-400 via-violet-400 to-pulse-300"
        />
      </div>
      {children}
    </div>
  );
}
