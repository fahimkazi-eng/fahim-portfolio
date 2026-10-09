"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  navItems,
  site,
  heroIdentity,
  heroHeadline,
  heroStatus,
  heroMetrics,
  heroCtaPrimary,
  heroCtaSecondary,
} from "@/lib/site";
import { Magnetic } from "@/components/ui/magnetic";
import { usePrefersReducedMotion } from "@/components/animations/motion-primitives";
import { Preloader, Marquee } from "@/components/ui/marquee";
import { Button } from "@/components/ui/button";
import { HeroStarfield } from "@/components/effects/starfield";

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

/* The owner's real portrait (F:\web\hero avatar.jpeg), committed to `public/`.
   Rendered full-bleed as the hero background beneath type, scrims and live
   atmosphere — no composite, no stand-in. */
const HERO_PORTRAIT = "/portraits/hero-portrait.jpg";

/* --------------------------------------------------------------------------
   Reference composition (01 — HERO):

   LEFT column:  identity label → name → statement headline → CTAs → metrics.
   RIGHT column: cinematic OGL with a SYSTEM STATUS panel overlaid
                 (availability · location · live local time · currently · stack).

   The identity sequence is one GSAP timeline owning transform/opacity/clip on
   the data-hero-* hooks below; the field owns its own parallax/velocity. No
   two tweens write the same element's transform (MOTION.md).
   -------------------------------------------------------------------------- */

export function Hero() {
  const rootRef = useRef<HTMLElement | null>(null);
  const mediaRef = useRef<HTMLDivElement | null>(null);
  const portraitRef = useRef<HTMLDivElement | null>(null);
  const reduced = usePrefersReducedMotion();

  /* ---- entrance timeline ---- */
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
          0.1,
        )
        /* The statement headline: word by word, one beat behind the name. */
        .fromTo(
          "[data-hero-role-word]",
          { yPercent: 118, autoAlpha: 0 },
          {
            yPercent: 0,
            autoAlpha: 1,
            duration: 0.95,
            stagger: 0.07,
            ease: "expo.out",
            onComplete: () =>
              gsap.set("[data-hero-role-word]", {
                clearProps: "transform,opacity,visibility",
              }),
          },
          0.5,
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
          0.66,
        )
        .fromTo(
          "[data-hero-metrics]",
          { autoAlpha: 0, y: 16 },
          { autoAlpha: 1, y: 0, duration: 0.85 },
          0.78,
        )
        .fromTo(
          "[data-hero-status]",
          { autoAlpha: 0, y: 26 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 1,
            onComplete: () =>
              gsap.set("[data-hero-status]", { clearProps: "transform" }),
          },
          0.72,
        )
        /* The portrait fades in on opacity only: the parallax tween owns its
           transform, so this timeline must not touch it (MOTION.md). */
        .fromTo(
          "[data-hero-photo]",
          { autoAlpha: 0 },
          {
            autoAlpha: 1,
            duration: 1.15,
            onComplete: () =>
              gsap.set("[data-hero-photo]", { clearProps: "opacity,visibility" }),
          },
          0.6,
        )
        .fromTo(
          "[data-hero-rail]",
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.8 },
          0.95,
        );
    }, root);

    return () => ctx.revert();
  }, [reduced]);

  /* ---- ambient field parallax (scroll-linked, runs for the page's life) -- */
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

  /* ---- portrait parallax (scroll-linked, desktop only) ------------------
     The layered portrait drifts a few percent in the opposite direction to
     the aurora wrapper beneath it, which is what sells the depth between the
     atmosphere and the figure. Owns yPercent on `[data-hero-photo]` only.
     Reduced motion: off. */
  useLayoutEffect(() => {
    const el = portraitRef.current;
    if (reduced || !el) return;
    if (!window.matchMedia("(min-width: 1024px)").matches) return;

    const tween = gsap.fromTo(
      el,
      { yPercent: 3.5 },
      {
        yPercent: -3.5,
        ease: "none",
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 0.6,
        },
      },
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [reduced]);

  /* ---- scroll-velocity reaction ----------------------------------------
     Owns skewY/scale on [data-hero-velocity] only; the ambient tween above
     owns yPercent/scale/opacity on the OUTER wrapper. Reduced motion: off. */
  useLayoutEffect(() => {
    const el = rootRef.current?.querySelector<HTMLElement>(
      "[data-hero-velocity]",
    );
    if (reduced || !el) return;

    const skewTo = gsap.quickTo(el, "skewY", {
      duration: 0.85,
      ease: "power3.out",
    });
    const scaleTo = gsap.quickTo(el, "scale", {
      duration: 0.85,
      ease: "power3.out",
    });

    let lastY = window.scrollY;
    let active = false;
    let raf = 0;
    let idleTimer: ReturnType<typeof setTimeout> | undefined;

    const tick = () => {
      raf = 0;
      const nowY = window.scrollY;
      const dy = nowY - lastY;
      lastY = nowY;
      const k = Math.max(-1, Math.min(1, dy / 24));
      if (Math.abs(k) > 0.015) {
        skewTo(k * -2.75);
        scaleTo(1 + Math.abs(k) * 0.035);
      }
    };

    const settle = () => {
      active = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      gsap.to(el, {
        skewY: 0,
        scale: 1,
        duration: 0.9,
        ease: "power3.out",
      });
    };

    const onScroll = () => {
      if (!active) {
        active = true;
        raf = requestAnimationFrame(tick);
      }
      clearTimeout(idleTimer);
      idleTimer = setTimeout(settle, 200);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
      clearTimeout(idleTimer);
      gsap.set(el, { clearProps: "skewY,scale" });
    };
  }, [reduced]);

  return (
    <section
      id="hero"
      ref={rootRef}
      className="vignette relative isolate flex min-h-[100svh] flex-col overflow-hidden pt-24 pb-8"
    >
      {/* ---- full-screen photographic background ----
          The portrait IS the hero scene now: one 1600×900 frame covering
          the viewport, graded navy/violet, with scrims holding quiet space
          for the type on the left, under the nav, and above the rail. */}
      <div
        ref={portraitRef}
        data-hero-photo
        aria-hidden="true"
        className="absolute inset-0 scale-[1.06] will-change-transform"
      >
        <Image
          src={HERO_PORTRAIT}
          alt=""
          fill
          priority
          sizes="100vw"
          quality={82}
          className="object-cover object-[60%_38%]"
        />
        {/* Cinematic grade: cool navy body with violet/blue light. */}
        <div className="absolute inset-0 bg-[radial-gradient(60%_55%_at_78%_14%,color-mix(in_oklab,var(--accent)_22%,transparent),transparent_72%),radial-gradient(46%_42%_at_6%_78%,color-mix(in_oklab,var(--violet)_20%,transparent),transparent_74%)]" />
        {/* Readability scrims: text side, top (nav), bottom (rail). */}
        <div className="absolute inset-0 bg-gradient-to-r from-canvas/90 via-canvas/45 to-canvas/10" />
        <div className="absolute inset-0 bg-gradient-to-b from-canvas/75 via-transparent to-canvas/90" />
      </div>

      {/* ---- live atmosphere drifting over the photograph ---- */}
      <div
        ref={mediaRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 will-change-transform"
      >
        {/* Drifting nebula bands — rich but transform-only, and
            neutralised by the global reduced-motion rule. */}
        <div className="absolute -left-[12%] top-[6%] size-[42rem] rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--color-violet-500)_24%,transparent),transparent_70%)] blur-3xl [animation:mesh-drift_38s_ease-in-out_infinite]" />
        <div className="absolute right-[-10%] top-[44%] size-[34rem] rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--color-signal-500)_22%,transparent),transparent_72%)] blur-3xl [animation:mesh-drift_46s_ease-in-out_infinite_reverse]" />
        <div className="glow-orb absolute left-[38%] top-[8%] size-[26rem] rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--color-pulse-400)_13%,transparent),transparent_70%)] blur-3xl" />

        {/* Faint light shafts raking down from the top edge. */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/3 left-[16%] h-[170%] w-[42%] rotate-[18deg] bg-[linear-gradient(to_bottom,transparent,color-mix(in_oklab,var(--color-signal-400)_13%,transparent),transparent)] blur-2xl" />
          <div className="absolute -top-1/3 right-[22%] h-[170%] w-[30%] rotate-[-14deg] bg-[linear-gradient(to_bottom,transparent,color-mix(in_oklab,var(--color-violet-400)_11%,transparent),transparent)] blur-2xl" />
        </div>
        {/* Top highlight wash so the hero opens with light, not black. */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-accent/[0.09] via-violet-500/[0.05] to-transparent" />

        <div
          data-hero-velocity
          className="absolute inset-0 will-change-transform"
        >
          <HeroStarfield className="absolute inset-0 h-full w-full" />
          <AuroraField
            intensity={1.05}
            className="absolute inset-0 h-full w-full opacity-60"
          />
          <div className="grid-lines absolute inset-0 [mask-image:radial-gradient(78%_62%_at_50%_40%,black,transparent)]" />
        </div>

        {/* Orbital path over the planet quadrant. Desktop-only so it never
            rakes across the stacked mobile composition. */}
        <div className="absolute right-[-8%] top-[4%] hidden h-[46rem] w-[46rem] opacity-[0.34] lg:block">
          <svg
            viewBox="0 0 400 400"
            className="h-full w-full [animation:orbit-spin_90s_linear_infinite]"
          >
            <ellipse
              cx="200"
              cy="200"
              rx="190"
              ry="118"
              fill="none"
              stroke="var(--color-signal-400)"
              strokeWidth="0.6"
              strokeDasharray="2 8"
              transform="rotate(-20 200 200)"
            />
            <ellipse
              cx="200"
              cy="200"
              rx="150"
              ry="150"
              fill="none"
              stroke="var(--color-violet-400)"
              strokeWidth="0.4"
              strokeDasharray="1 10"
            />
          </svg>
          {/* A single travelling node on the ring. */}
          <div className="absolute inset-0 [animation:orbit-spin_26s_linear_infinite]">
            <span className="absolute left-1/2 top-[6%] size-1.5 -translate-x-1/2 rounded-full bg-pulse-300 shadow-[0_0_12px_3px_color-mix(in_oklab,var(--color-pulse-400)_60%,transparent)]" />
          </div>
        </div>
      </div>

      {/* ---- foreground: identity, actions and live panels float over the photograph ---- */}
      <div className="gutter shell relative z-10 flex w-full flex-1 flex-col justify-end pb-8">
        {/* Eyebrow row: identity left, live build chip right */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            {/* Identity label */}
            <p
              data-hero-meta
              className="type-mono mb-4 flex flex-wrap items-center gap-3 text-fg-muted"
            >
              <span
                aria-hidden="true"
                className="h-px w-10 bg-gradient-to-r from-accent to-violet-400"
              />
              {heroIdentity}
            </p>
            {/* Live availability chip */}
            <p
              data-hero-meta
              className="inline-flex items-center gap-2.5 rounded-pill border border-ok-400/30 bg-ok-500/10 px-3.5 py-1.5 backdrop-blur-sm"
            >
              <span aria-hidden="true" className="relative grid size-2 place-items-center">
                <span className="absolute size-2 rounded-full bg-ok-400" />
                <span className="live-dot-ring absolute size-2 rounded-full bg-ok-400" />
              </span>
              <span className="type-mono text-ok-300">
                {heroMetrics.availability} · {heroStatus.location}
              </span>
            </p>
          </div>
          <div
            data-hero-meta
            className="float-slow hidden items-center gap-2 rounded-pill border border-line-strong/70 bg-canvas/70 px-3 py-1.5 backdrop-blur-md lg:inline-flex"
          >
            <span aria-hidden="true" className="relative grid size-2 place-items-center">
              <span className="absolute size-2 rounded-full bg-pulse-300" />
              <span className="live-dot-ring absolute size-2 rounded-full bg-pulse-300" />
            </span>
            <span className="type-mono text-fg">Building {heroStatus.currently}</span>
          </div>
        </div>

        {/* Name */}
        <h1
          data-hero-name
          className="type-display text-name mt-[clamp(1rem,2vw,1.5rem)] leading-[0.82] drop-shadow-[0_2px_28px_rgba(5,7,13,0.9)]"
        >
          <span className="sr-only">
            {site.name} — {site.role}
          </span>
          <span aria-hidden="true" className="block">
            <MaskedLine text={FIRST} className="block text-fg" />
            <MaskedLine
              text={LAST}
              className="text-premium-gradient block pl-[7%] lg:pl-0"
            />
          </span>
        </h1>

        {/* Statement headline */}
        <p className="mt-[clamp(1.25rem,2.4vw,2rem)] max-w-[34ch] drop-shadow-[0_1px_16px_rgba(5,7,13,0.9)]">
          <span className="sr-only">{heroHeadline}</span>
          <span
            aria-hidden="true"
            className="font-display text-[clamp(1.4rem,1.15rem+1.6vw,2.5rem)] font-semibold leading-[1.02] tracking-[-0.02em] text-fg"
          >
            <MaskedLineHook text={heroHeadline} />
          </span>
        </p>

        {/* CTAs */}
        <div
          data-hero-actions
          className="mt-[clamp(1.75rem,3.6vw,2.75rem)] flex flex-wrap items-center gap-3"
        >
          <Magnetic strength={9}>
            <Button asChild size="lg" variant="accent" className="btn-shine">
              <a href={heroCtaPrimary.href}>
                {heroCtaPrimary.label}
                <ArrowUpRight className="size-4" strokeWidth={2} />
              </a>
            </Button>
          </Magnetic>
          <Magnetic strength={9}>
            <Button asChild size="lg" variant="outline" className="backdrop-blur-sm">
              <a href={heroCtaSecondary.href}>{heroCtaSecondary.label}</a>
            </Button>
          </Magnetic>
        </div>

        {/* Bottom row: metrics left, system status right */}
        <div className="mt-[clamp(2rem,4vw,3rem)] grid items-end gap-4 lg:grid-cols-12">
          {/* Metrics — truthful numbers only, presented as live stat cards */}
          <div
            data-hero-metrics
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:col-span-7"
          >
            <MetricCard value={heroMetrics.products} label="Products Shipped" accent="from-signal-400 to-violet-400" />
            <MetricCard value={heroMetrics.builds} label="Public Builds" accent="from-violet-400 to-pulse-300" />
            <div className="glass-strong edge-glow col-span-2 flex items-center gap-3 rounded-card px-4 py-3.5 sm:col-span-1">
              <span aria-hidden="true" className="relative grid size-2.5 shrink-0 place-items-center">
                <span className="absolute size-2.5 rounded-full bg-ok-400 shadow-[0_0_12px_2px_color-mix(in_oklab,var(--color-ok-400)_60%,transparent)]" />
                <span className="live-dot-ring absolute size-2.5 rounded-full bg-ok-400" />
              </span>
              <span className="type-mono leading-snug text-fg">
                {heroMetrics.availability}
              </span>
            </div>
          </div>

          {/* System status panel */}
          <div data-hero-status className="lg:col-span-5">
            {/* Grid wash behind the panel, keeps the technical feel */}
            <div
              aria-hidden="true"
              className="grid-lines absolute -inset-x-8 -inset-y-10 -z-10 rounded-card opacity-60 [mask-image:radial-gradient(70%_70%_at_50%_40%,black,transparent)]"
            />
            <div className="glass-strong edge-glow rounded-card">
              <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
                <span className="type-mono flex items-center gap-2 text-fg">
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-signal-400 to-pulse-300" />
                  Live System Status
                </span>
                <LiveDot />
              </div>

              {/* Status line */}
              <p className="flex items-center gap-2.5 px-5 pt-4">
                <span
                  aria-hidden="true"
                  className="relative grid size-2 place-items-center"
                >
                  <span className="absolute size-2 rounded-full bg-ok-400" />
                  <span
                    aria-hidden="true"
                    className="absolute size-2 rounded-full bg-ok-400 [animation:pulse-ring_2.4s_ease-out_infinite]"
                  />
                </span>
                <span className="type-mono text-ok-300">
                  {heroStatus.statusLine}
                </span>
              </p>

              <dl className="mt-2 divide-y divide-line border-t border-line px-5 pb-5 pt-1">
                <StatusRow label="Location" value={heroStatus.location} />
                <StatusRow label="Local Time">
                  <LocalClock />
                </StatusRow>
                <StatusRow
                  label="Currently building"
                  value={heroStatus.currently}
                />
                <StatusRow
                  label="Stack"
                  value={heroStatus.stack.join("  /  ")}
                />
              </dl>
            </div>
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
            href={`#work`}
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

/* ---------------------------------------------------------------------------
   Local helpers
   --------------------------------------------------------------------------- */

/** A premium glass metric card with gradient numerals. */
function MetricCard({
  value,
  label,
  accent,
}: {
  value: string;
  label: string;
  accent: string;
}) {
  return (
    <div className="glass-strong edge-glow card-lift rounded-card px-4 py-3.5">
      <p
        className={`bg-gradient-to-r ${accent} bg-clip-text font-display text-[1.9rem] font-semibold leading-none tracking-[-0.02em] text-transparent tabular-nums`}
      >
        {value}
      </p>
      <p className="type-mono mt-2 text-fg-muted">{label}</p>
    </div>
  );
}

/** A mono label/value row for the system status panel. */
function StatusRow({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-6 py-2.5">
      <dt className="type-mono shrink-0 text-fg-subtle">{label}</dt>
      <dd className="text-right text-[0.85rem] text-fg">
        {children ?? value}
      </dd>
    </div>
  );
}

/** Live local clock for the status panel. Time data, not motion. */
function LocalClock() {
  const [now, setNow] = useState<string>("");
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: heroStatus.timeZone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const tick = () => setNow(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="inline-flex items-center gap-2">
      <span className="tabular-nums">{now || "—:—:—"}</span>
      <span className="type-mono rounded border border-pulse-600/40 bg-pulse-500/10 px-1.5 py-0.5 text-[0.55rem] text-pulse-300">
        LIVE
      </span>
    </span>
  );
}

/** Live status dot used in the panel header. */
function LiveDot() {
  return (
    <span
      aria-hidden="true"
      className="relative grid size-2 place-items-center"
    >
      <span className="absolute size-2 rounded-full bg-pulse-400" />
      <span className="absolute size-2 rounded-full bg-pulse-400 [animation:pulse-ring_2.4s_ease-out_infinite]" />
    </span>
  );
}

/* --------------------------------------------------------------------------
   One line of the name. Each glyph sits in its own mask and rises out of it.
   These spans carry `data-hero-char` purely as a hook for the timeline.
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

/**
 * The statement headline, hanging off the same timeline via `data-hero-role-word`.
 * Word spacing lives in the gap so no literal space travels through an
 * overflow-hidden mask (which would pulse the gap).
 */
function MaskedLineHook({ text }: { text: string }) {
  const words = text.split(" ");

  return (
    <span className="inline-block [text-wrap:balance]">
      {words.map((word, i) => (
        <span className="inline-flex gap-[0.32em]" key={`${word}-${i}`}>
          <span className="inline-block overflow-hidden align-bottom [clip-path:inset(-0.3em_-0.2em_-0.1em_-0.2em)]">
            <span data-hero-role-word className="inline-block">
              {word}
            </span>
          </span>
          {i < words.length - 1 ? (
            <span aria-hidden="true" className="text-transparent">
              &nbsp;
            </span>
          ) : null}
        </span>
      ))}
    </span>
  );
}

/** Exported so the page can own the single preloader instance. */
export { Preloader };