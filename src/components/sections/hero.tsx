"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { site, navItems } from "@/lib/site";
import { SplitText } from "@/components/animations/split-text";
import { Magnetic } from "@/components/ui/magnetic";
import { usePrefersReducedMotion } from "@/components/animations/motion-primitives";
import { Preloader, Marquee } from "@/components/ui/marquee";
import { Button } from "@/components/ui/button";
import { TypeCaret } from "./type-caret";

/* The WebGL field is a client-only browser dependency: dynamic import with
   ssr:false keeps it out of the server bundle and off the critical path. */
const AuroraField = dynamic(
  () => import("@/components/effects/aurora-field"),
  { ssr: false },
);

const TICKER = [
  "Computer Science & Engineering",
  "Full-stack Web",
  "PostgreSQL",
  "TypeScript",
  "Next.js",
  "UI Engineering",
  "Product Thinking",
];

export function Hero() {
  const rootRef = useRef<HTMLElement | null>(null);
  const mediaRef = useRef<HTMLDivElement | null>(null);
  const reduced = usePrefersReducedMotion();

  /* Scroll parallax on the hero art. transform only. */
  useEffect(() => {
    if (reduced) return;
    const el = mediaRef.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);

    const tween = gsap.to(el, {
      yPercent: 16,
      scale: 0.94,
      opacity: 0.35,
      ease: "none",
      scrollTrigger: {
        trigger: rootRef.current,
        start: "top top",
        end: "bottom top",
        scrub: 0.5,
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [reduced]);

  return (
    <section
      id="hero"
      ref={rootRef}
      className="vignette relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden pt-28 pb-8"
    >
      {/* ---- ambient layers ---- */}
      <div
        ref={mediaRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 will-change-transform"
      >
        {/* CSS base gradient: always painted, so the hero still looks right
            with WebGL disabled, reduced motion on, or before hydration. */}
        <div className="absolute inset-0 bg-[radial-gradient(60%_55%_at_72%_18%,color-mix(in_oklab,var(--accent)_18%,transparent),transparent_70%),radial-gradient(45%_40%_at_18%_72%,color-mix(in_oklab,var(--accent)_9%,transparent),transparent_72%)]" />
        <AuroraField intensity={1.05} className="absolute inset-0 h-full w-full opacity-[var(--aurora-opacity)]" />
        <div className="grid-lines absolute inset-0 [mask-image:radial-gradient(75%_60%_at_50%_40%,black,transparent)]" />
      </div>

      {/* ---- content ---- */}
      <div className="gutter shell relative w-full">
        {/* Row 1 — status strip */}
        <div className="mb-[clamp(2rem,5vw,4rem)] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="relative grid size-2 place-items-center">
              <span className="absolute size-2 rounded-full bg-accent" />
              <span
                aria-hidden="true"
                className="absolute size-2 rounded-full bg-accent [animation:pulse-ring_2.4s_ease-out_infinite]"
              />
            </span>
            <span className="type-mono text-fg-muted">
              {site.availability}
            </span>
          </div>
          <span className="type-mono text-fg-subtle">
            {site.location} · {site.university}
          </span>
        </div>

        {/* Row 2 — display type */}
        <h1 className="type-display relative">
          <span className="block text-h2 leading-[0.9] text-fg-muted">
            <SplitText text="Software" split="chars" immediate duration={1.1} />
          </span>
          <span className="block text-h1 leading-[0.86] text-fg">
            <SplitText
              text="Developer"
              split="chars"
              immediate
              delay={0.16}
              duration={1.2}
            />
          </span>
          <span className="mt-1 flex items-end gap-[clamp(0.75rem,2vw,2rem)]">
            <span className="type-display text-h1 text-signal-gradient">
              <SplitText
                text="Builder"
                split="chars"
                immediate
                delay={0.32}
                duration={1.2}
              />
            </span>
            <TypeCaret />
          </span>
        </h1>

        {/* Row 3 — lede + actions, asymmetric */}
        <div className="mt-[clamp(2rem,4.5vw,3.5rem)] grid grid-cols-1 gap-8 md:grid-cols-12 md:items-end">
          <p className="md:col-span-4 md:col-start-1 text-lead text-fg-muted [text-wrap:pretty]">
            {site.roleLine}
            <br />
            <span className="text-fg-subtle">{site.degree}</span>
          </p>

          <div className="flex flex-wrap items-center gap-3 md:col-span-4 md:col-start-7 md:justify-end">
            <Magnetic strength={9}>
              <Button asChild size="lg" variant="accent">
                <a href="#work">
                  View selected work
                  <ArrowUpRight className="size-4" strokeWidth={2} />
                </a>
              </Button>
            </Magnetic>
            <Magnetic strength={9}>
              <Button asChild size="lg" variant="outline">
                <a href="#contact">Get in touch</a>
              </Button>
            </Magnetic>
          </div>
        </div>
      </div>

      {/* ---- bottom rail ---- */}
      <div className="gutter shell relative mt-[clamp(2.5rem,6vw,5rem)] w-full">
        <div className="rule flex flex-col gap-4 pt-5 md:flex-row md:items-center md:justify-between">
          <a
            href={`#${navItems[0].id}`}
            className="group inline-flex items-center gap-2.5 text-fg-muted transition-colors duration-300 hover:text-fg"
          >
            <span
              aria-hidden="true"
              className="grid size-8 place-items-center rounded-full border border-line-strong transition-colors duration-300 group-hover:border-accent"
            >
              <ArrowDown
                className="size-3.5 transition-transform duration-300 group-hover:translate-y-0.5"
                strokeWidth={2}
              />
            </span>
            <span className="type-mono">Scroll</span>
          </a>

          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {navItems.slice(0, 5).map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="type-mono text-fg-subtle transition-colors duration-300 hover:text-accent"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <Marquee
          speed={46}
          className="mt-6 border-y border-line py-3.5"
          separator="/"
        >
          {TICKER.map((item) => (
            <span key={item} className="type-mono whitespace-nowrap text-fg-subtle">
              {item}
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  );
}

/** Exported so the page can own the single preloader instance. */
export { Preloader };
