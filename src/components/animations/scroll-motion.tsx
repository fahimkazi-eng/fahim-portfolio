"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePrefersReducedMotion } from "@/components/animations/motion-primitives";

/* ==========================================================================
   Scroll-linked motion. All of it goes through ScrollTrigger so there is
   exactly one scroll system on the page.
   ========================================================================== */

/* --------------------------------------------------------------------------
   ScrollProgress — a fixed 2px bar. scrub: true means it is a direct
   function of scroll position, not a tween.
   -------------------------------------------------------------------------- */

export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement | null>(null);
  const pctRef = useRef<HTMLSpanElement | null>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    gsap.registerPlugin(ScrollTrigger);

    if (reduced) {
      // Static indicator rather than nothing: orientation still matters.
      bar.style.transform = "scaleX(0)";
      return;
    }

    const tween = gsap.fromTo(
      bar,
      { scaleX: 0 },
      {
        scaleX: 1,
        ease: "none",
        scrollTrigger: {
          trigger: document.documentElement,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.25,
        },
      },
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [reduced]);

  useEffect(() => {
    const pct = pctRef.current;
    if (!pct || reduced) return;

    const handler = () => {
      const max = document.body.scrollHeight - window.innerHeight;
      const value = max > 0 ? Math.round((window.scrollY / max) * 100) : 0;
      pct.textContent = String(value).padStart(2, "0");
    };
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [reduced]);

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 z-[65] h-[2px] origin-left bg-accent/85 mix-blend-plus-lighter"
      >
        <div
          ref={barRef}
          className="h-full w-full origin-left bg-accent"
          style={{ transform: "scaleX(0)" }}
        />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed right-4 bottom-4 z-[64] hidden mix-blend-difference lg:block"
      >
        <span ref={pctRef} className="type-mono text-fg/70 tabular-nums">
          00
        </span>
      </div>
    </>
  );
}

/* --------------------------------------------------------------------------
   Parallax — translateY scrubbed against scroll. transform only, so it
   composites and never triggers layout.
   -------------------------------------------------------------------------- */

export function Parallax({
  children,
  speed = 0.18,
  className,
}: {
  children: ReactNode;
  /** Positive moves down, negative moves up. In viewport-height units. */
  speed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    gsap.registerPlugin(ScrollTrigger);

    const tween = gsap.fromTo(
      el,
      { yPercent: -speed * 50 },
      {
        yPercent: speed * 50,
        ease: "none",
        scrollTrigger: {
          trigger: el.parentElement ?? el,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      },
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [speed, reduced]);

  return (
    <div ref={ref} className={className} style={{ willChange: "transform" }}>
      {children}
    </div>
  );
}

/* --------------------------------------------------------------------------
   StickyScroll — pins a media panel while its text column scrolls past.
   The core storytelling device for the project case studies.
   -------------------------------------------------------------------------- */

export function StickyScroll({
  children,
  className = "",
  top = "top-24",
}: {
  children: ReactNode;
  className?: string;
  top?: string;
}) {
  return (
    <div className={className}>
      <div className={`sticky ${top} z-10`}>{children}</div>
    </div>
  );
}

/* --------------------------------------------------------------------------
   HorizontalScroll — pins a section and scrubs a horizontal track.
   Track width is set in CSS (--track) so no measurement pass is needed.
   -------------------------------------------------------------------------- */

export function HorizontalScroll({
  children,
  className = "",
  trackClassName = "",
}: {
  children: ReactNode;
  className?: string;
  trackClassName?: string;
}) {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    // Touch devices keep native vertical scrolling. Converting a vertical
    // gesture into horizontal movement is where these sections usually
    // become unusable, so we simply do not pin them.
    if (reduced || window.matchMedia("(pointer: coarse)").matches) return;

    gsap.registerPlugin(ScrollTrigger);

    const distance = () => track.scrollWidth - window.innerWidth;

    const tween = gsap.to(track, {
      x: () => -distance(),
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: () => `+=${Math.max(0, distance())}`,
        pin: true,
        scrub: 0.6,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      gsap.set(track, { clearProps: "transform" });
    };
  }, [reduced]);

  return (
    <div ref={sectionRef} className={`relative overflow-hidden ${className}`}>
      <div ref={trackRef} className={`flex w-max ${trackClassName}`}>
        {children}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------
   CountUp — animates a number when it scrolls into view.
   Uses GSAP so the value never passes through React state.
   -------------------------------------------------------------------------- */

export function CountUp({
  to,
  duration = 1.4,
  className,
  suffix = "",
}: {
  to: number;
  duration?: number;
  className?: string;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);

    if (reduced) {
      el.textContent = `${to}${suffix}`;
      return;
    }

    const counter = { value: 0 };
    const tween = gsap.to(counter, {
      value: to,
      duration,
      ease: "expo.out",
      snap: { value: 1 },
      scrollTrigger: { trigger: el, start: "top 92%", once: true },
      onUpdate: () => {
        el.textContent = `${Math.round(counter.value)}${suffix}`;
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [to, duration, suffix, reduced]);

  return (
    <span ref={ref} className={className}>
      {reduced ? `${to}${suffix}` : `0${suffix}`}
    </span>
  );
}
