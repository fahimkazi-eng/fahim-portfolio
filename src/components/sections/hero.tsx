"use client";

import dynamic from "next/dynamic";
import { useLayoutEffect, useRef } from "react";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { site, navItems } from "@/lib/site";
import { Magnetic } from "@/components/ui/magnetic";
import { Portrait } from "@/components/ui/portrait";
import { usePrefersReducedMotion } from "@/components/animations/motion-primitives";
import { Preloader, Marquee } from "@/components/ui/marquee";
import { Button } from "@/components/ui/button";

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

const FIRST = "Kazi";
const LAST = "Fahim";

/**
 * `portraitSrc` is resolved by the server component that renders this one
 * (`page.tsx`) via `portraitAssetExists()`. It is `null` when this deployment
 * has no photograph in `public/`, in which case `Portrait` renders its monogram
 * alone and issues no request. The filesystem is not reachable from here.
 */
export function Hero({ portraitSrc }: { portraitSrc: string | null }) {
  const rootRef = useRef<HTMLElement | null>(null);
  const mediaRef = useRef<HTMLDivElement | null>(null);
  const reduced = usePrefersReducedMotion();

  /* -------------------------------------------------------------------------
     One timeline for the whole identity sequence.

     Everything the visitor sees on arrival is choreographed here — the
     status strip, every character of the name, the portrait's iris wipe, the
     glow behind it, then the actions. It is a single timeline rather than a
     pile of independent tweens so the beats stay locked to each other no
     matter how long the portrait image takes to decode.

     Ownership, per MOTION.md:
       - this timeline owns transform/opacity/clip-path on the ELEMENTS it
         names, once, on load.
       - the pointer glow below owns x/y on [data-hero-glow] only.
       - the depth parallax owns yPercent on [data-hero-name] and
         [data-hero-portrait] only.
     No two of them ever write the same element's transform.
     ------------------------------------------------------------------------- */
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (reduced || !root) return;

    const ctx = gsap.context(() => {
      gsap.registerPlugin(ScrollTrigger);

      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });

      tl.fromTo(
        "[data-hero-meta]",
        { autoAlpha: 0, y: 14 },
        { autoAlpha: 1, y: 0, duration: 0.7 },
        0,
      )
        .fromTo(
          "[data-hero-char]",
          { yPercent: 112 },
          {
            yPercent: 0,
            duration: 1.15,
            stagger: { each: 0.028, from: "start" },
            onComplete: () =>
              gsap.set("[data-hero-char]", { clearProps: "transform" }),
          },
          0.14,
        )
        .fromTo(
          "[data-hero-portrait-mask]",
          { clipPath: "circle(4% at 50% 50%)" },
          {
            clipPath: "circle(78% at 50% 50%)",
            duration: 1.25,
            ease: "expo.out",
            onComplete: () =>
              gsap.set("[data-hero-portrait-mask]", { clearProps: "clipPath" }),
          },
          0.46,
        )
        .fromTo(
          "[data-hero-portrait-media]",
          { scale: 1.16 },
          {
            scale: 1,
            duration: 1.6,
            onComplete: () =>
              gsap.set("[data-hero-portrait-media]", { clearProps: "transform" }),
          },
          0.46,
        )
        /* Opacity only. The glow's transform belongs to the pointer below. */
        .fromTo(
          "[data-hero-glow]",
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 1.5, ease: "sine.out" },
          0.55,
        )
        .fromTo(
          "[data-hero-actions]",
          { autoAlpha: 0, y: 22 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.9,
            onComplete: () =>
              gsap.set("[data-hero-actions]", { clearProps: "transform" }),
          },
          0.74,
        )
        .fromTo(
          "[data-hero-rail]",
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.8 },
          0.95,
        );

      /* ---- depth parallax: the type lifts, the portrait sinks. Counter
         motion on two elements that the timeline above no longer touches. */
      gsap.to("[data-hero-name]", {
        yPercent: -7,
        ease: "none",
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "bottom top",
          scrub: 0.5,
        },
      });

      gsap.to("[data-hero-portrait]", {
        yPercent: 9,
        ease: "none",
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "bottom top",
          scrub: 0.5,
        },
      });
    }, root);

    return () => ctx.revert();
  }, [reduced]);

  /* Ambient field parallax. Separate from the timeline: it is scroll-linked
     (GSAP's job) and it runs for the life of the page, not once on load. */
  useLayoutEffect(() => {
    const el = mediaRef.current;
    if (reduced || !el) return;

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

  /* ---- pointer-reactive glow behind the portrait ------------------------
     quickTo writes x/y on the glow element only, and the glow's opacity is
     owned by the entrance timeline. No overlap. Fine pointers only. */
  const glowRef = useRef<HTMLSpanElement | null>(null);
  useLayoutEffect(() => {
    const glow = glowRef.current;
    const portrait = rootRef.current?.querySelector<HTMLElement>(
      "[data-hero-portrait]",
    );
    if (reduced || !glow || !portrait) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const xTo = gsap.quickTo(glow, "x", { duration: 0.9, ease: "power3.out" });
    const yTo = gsap.quickTo(glow, "y", { duration: 0.9, ease: "power3.out" });

    const onMove = (event: PointerEvent) => {
      const rect = portrait.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      xTo((event.clientX - cx) * 0.14);
      yTo((event.clientY - cy) * 0.14);
    };
    const onLeave = () => {
      xTo(0);
      yTo(0);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      gsap.set(glow, { clearProps: "transform" });
    };
  }, [reduced]);

  return (
    <section
      id="hero"
      ref={rootRef}
      className="vignette relative isolate flex min-h-[100svh] flex-col overflow-hidden pt-28 pb-8"
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
        <AuroraField
          intensity={1.05}
          className="absolute inset-0 h-full w-full opacity-[var(--aurora-opacity)]"
        />
        <div className="grid-lines absolute inset-0 [mask-image:radial-gradient(75%_60%_at_50%_40%,black,transparent)]" />
      </div>

      {/* ---- content ---- */}
      <div className="gutter shell relative flex w-full flex-1 flex-col justify-center">
        {/* Row 1 — status strip */}
        <div
          data-hero-meta
          className="mb-[clamp(1.5rem,4vw,3rem)] flex flex-wrap items-center justify-between gap-4"
        >
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

        {/* Row 2 — the identity lockup.
            Mobile: name full-bleed, portrait tucked right beneath it.
            Desktop: name left, portrait right, baseline-aligned. Different
            compositions rather than one layout squeezed twice. */}
        <div className="grid grid-cols-4 items-end gap-x-[clamp(1rem,3vw,2.5rem)] gap-y-8 lg:grid-cols-12">
          <div
            data-hero-name
            className="col-span-4 lg:col-span-7"
          >
            <h1 className="type-display text-name leading-[0.82]">
              {/* The accessible name is one real string. The per-character
                  spans below are visual only. Same pattern as SplitText —
                  hidden text rather than aria-label, because a role-less
                  span may not carry one. */}
              <span className="sr-only">
                {site.name} — {site.role}
              </span>
              <span aria-hidden="true" className="block">
                <MaskedLine text={FIRST} className="block text-fg" />
                <MaskedLine
                  text={LAST}
                  className="block pl-[8%] text-signal-gradient lg:pl-0"
                />
              </span>
            </h1>
          </div>

          {/* Portrait */}
          <div
            data-hero-portrait
            className="col-span-4 flex justify-end lg:col-span-5"
          >
            <div className="relative">
              {/* glow: opacity from the timeline, transform from the pointer */}
              <span
                ref={glowRef}
                data-hero-glow
                aria-hidden="true"
                className="pointer-events-none absolute -inset-[18%] -z-10 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--accent)_55%,transparent),transparent_66%)] blur-2xl"
              />
              {/* orbital hairline, purely decorative */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -inset-[7%] rounded-full border border-dashed border-accent/25 [animation:orbit-spin_38s_linear_infinite]"
              />
              <span
                data-hero-portrait-mask
                className="relative block overflow-hidden rounded-full"
              >
                <span data-hero-portrait-media className="block will-change-transform">
                  <Portrait
                    src={portraitSrc}
                    alt={site.portrait.alt}
                    size={1024}
                    sizes="(max-width: 640px) 62vw, (max-width: 1024px) 42vw, 24rem"
                    priority
                    className="size-[clamp(11rem,52vw,21rem)] ring-2 ring-accent/25"
                  />
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Row 3 — lede + actions, asymmetric */}
        <div
          data-hero-actions
          className="mt-[clamp(2rem,4.5vw,3.5rem)] grid grid-cols-1 gap-8 md:grid-cols-12 md:items-end"
        >
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
      <div
        data-hero-rail
        className="gutter shell relative mt-[clamp(2.5rem,6vw,4rem)] w-full"
      >
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

/* --------------------------------------------------------------------------
   One line of the name. Each glyph sits in its own mask and rises out of it.

   These spans carry `data-hero-char` purely as a hook — the hero timeline
   targets them. No component owns them, so there is nothing to keep in sync.
   -------------------------------------------------------------------------- */

function MaskedLine({ text, className }: { text: string; className?: string }) {
  return (
    <span className={className}>
      {Array.from(text).map((char, i) => (
        <span
          key={`${char}-${i}`}
          className="inline-block overflow-hidden align-bottom [clip-path:inset(-0.18em_-0.14em_-0.06em_-0.14em)]"
        >
          <span data-hero-char className="inline-block whitespace-pre">
            {char}
          </span>
        </span>
      ))}
    </span>
  );
}

/** Exported so the page can own the single preloader instance. */
export { Preloader };
