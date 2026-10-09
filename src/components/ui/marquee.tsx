"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { gsap } from "gsap";
import { usePrefersReducedMotion } from "@/components/animations/motion-primitives";
import { cn } from "@/lib/utils";

/* ==========================================================================
   Preloader — the one moment the site is allowed to be theatrical.

   Owns the page's scroll lock for its lifetime and hands it back on finish.
   GSAP owns a single numeric timeline value; no React state drives the bars,
   so the animation is frame-perfect even while React is busy rendering the
   page behind it.
   ========================================================================== */

type PreloaderProps = {
  /** Called once the intro finishes. */
  onComplete?: () => void;
  name?: string;
  role?: string;
};

export function Preloader({ onComplete, name, role }: PreloaderProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const counterRef = useRef<HTMLSpanElement | null>(null);
  const barRef = useRef<HTMLSpanElement | null>(null);
  const [hidden, setHidden] = useState(false);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const root = rootRef.current;
    const counter = counterRef.current;
    const bar = barRef.current;
    if (!root || !counter || !bar) return;

    // Lock scroll for the duration. Restored unconditionally on cleanup.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    if (reduced) {
      /* No intro, no scroll lock to keep. The element itself is hidden by
         the `prefers-reduced-motion` rule in globals.css, so it is removed
         visually the instant the media query applies — before hydration,
         which is why this is a CSS concern rather than a React one. */
      onComplete?.();
      document.body.style.overflow = previousOverflow;
      return;
    }

    const state = { progress: 0 };
    const finish = () => {
      document.body.style.overflow = previousOverflow;
      onComplete?.();
    };

    const tween = gsap.to(state, {
      progress: 1,
      duration: 1.65,
      ease: "power2.inOut",
      onUpdate: () => {
        const value = Math.round(state.progress * 100);
        counter.textContent = String(value).padStart(3, "0");
        gsap.set(bar, { scaleX: state.progress });
      },
      onComplete: () => {
        gsap.to(root, {
          yPercent: -100,
          duration: 0.85,
          ease: "expo.inOut",
          onComplete: () => {
            setHidden(true);
            finish();
          },
        });
      },
    });

    return () => {
      tween.kill();
      document.body.style.overflow = previousOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  if (hidden) return null;

  return (
    <div
      ref={rootRef}
      role="status"
      aria-live="polite"
      aria-label="Loading portfolio"
      data-preloader=""
      className="fixed inset-0 z-[100] flex flex-col justify-between bg-canvas px-[clamp(1.15rem,0.6rem+2.6vw,4.5rem)] py-[clamp(1.5rem,0.6rem+2vw,3rem)] will-change-transform"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="type-mono text-fg-muted">Portfolio</p>
          <p className="type-mono mt-1 text-fg-subtle">2026</p>
        </div>
        <p className="type-mono text-fg-subtle">Loading</p>
      </div>

      <div className="flex flex-col items-center gap-6">
        <p className="type-display text-h1 text-fg">{name}</p>
        <p className="type-mono text-fg-muted">{role}</p>
      </div>

      <div className="flex items-end justify-between gap-6">
        <div className="relative h-px flex-1 overflow-hidden bg-line-strong">
          <span
            ref={barRef}
            className="absolute inset-0 origin-left bg-accent"
            style={{ transform: "scaleX(0)" }}
          />
        </div>
        <span
          ref={counterRef}
          className="type-mono w-[4ch] text-right text-fg tabular-nums"
        >
          000
        </span>
      </div>
    </div>
  );
}

/* ==========================================================================
   Marquee — infinite ticker. CSS transform only, duplicated track so the
   -50% loop is seamless. Duplicates are aria-hidden.
   ========================================================================== */

export function Marquee({
  children,
  speed = 34,
  className = "",
  reverse = false,
  separator = "·",
}: {
  children: ReactNode;
  /** Seconds for one full loop. */
  speed?: number;
  className?: string;
  reverse?: boolean;
  separator?: string;
}) {
  return (
    <div
      className={cn(
        "group relative flex overflow-hidden",
        "[mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]",
        className,
      )}
    >
      <div
        className="flex min-w-full shrink-0 items-center gap-8 pr-8 will-change-transform motion-off:animate-none"
        style={{
          animation: `marquee-x ${speed}s linear infinite`,
          animationDirection: reverse ? "reverse" : "normal",
        }}
      >
        {children}
        <span aria-hidden="true" className="text-accent">
          {separator}
        </span>
      </div>
      {/* Second copy exists only to make the -50% loop seamless. */}
      <div
        aria-hidden="true"
        className="flex min-w-full shrink-0 items-center gap-8 pr-8 will-change-transform motion-off:animate-none"
        style={{
          animation: `marquee-x ${speed}s linear infinite`,
          animationDirection: reverse ? "reverse" : "normal",
        }}
      >
        {children}
        <span className="text-accent">{separator}</span>
      </div>
    </div>
  );
}

/* ==========================================================================
   PageTransition — a thin accent sweep between routes. Uses the View
   Transition API when available, and a CSS fallback animation otherwise.
   ========================================================================== */

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <div className="[&]:animate-[page-in_0.6s_cubic-bezier(0.16,1,0.3,1)_both] motion-off:animate-none">
      {children}
    </div>
  );
}
