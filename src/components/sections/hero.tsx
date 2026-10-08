"use client";

import dynamic from "next/dynamic";
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

/* --------------------------------------------------------------------------
   Reference composition (01 — HERO):

   LEFT column:  identity label → name → statement headline → CTAs → metrics.
   RIGHT column: cinematic OGL with a SYSTEM STATUS panel overlaid
                 (availability · location · live local time · currently · stack).

   The identity sequence is one GSAP timeline owning transform/opacity/clip on
   the data-hero-* hooks below; the field owns its own parallax/velocity. No
   two tweens write the same element's transform (MOTION.md).
   -------------------------------------------------------------------------- */

export function Hero({ projectCount }: { projectCount: number }) {
  const rootRef = useRef<HTMLElement | null>(null);
  const mediaRef = useRef<HTMLDivElement | null>(null);
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
        <div className="absolute inset-0 bg-[radial-gradient(62%_55%_at_78%_14%,color-mix(in_oklab,var(--accent)_16%,transparent),transparent_72%),radial-gradient(46%_42%_at_6%_78%,color-mix(in_oklab,var(--violet)_12%,transparent),transparent_74%)]" />
        <div
          data-hero-velocity
          className="absolute inset-0 will-change-transform"
        >
          <AuroraField
            intensity={1.05}
            className="absolute inset-0 h-full w-full opacity-[var(--aurora-opacity)]"
          />
          <div className="grid-lines absolute inset-0 [mask-image:radial-gradient(78%_62%_at_50%_40%,black,transparent)]" />
        </div>
      </div>

      {/* ---- content ---- */}
      <div className="gutter shell relative flex w-full flex-1 flex-col justify-center">
        <div className="grid grid-cols-1 items-center gap-[clamp(2.5rem,5vw,4.5rem)] lg:grid-cols-12 lg:gap-x-[clamp(1.5rem,4vw,3.5rem)]">
          {/* ======== LEFT: identity ======== */}
          <div className="lg:col-span-7">
            {/* Identity label */}
            <p
              data-hero-meta
              className="type-mono mb-[clamp(1.25rem,2.6vw,2rem)] flex items-center gap-3 text-fg-muted"
            >
              <span
                aria-hidden="true"
                className="h-px w-10 bg-accent/70"
              />
              {heroIdentity}
            </p>

            {/* Name */}
            <h1
              data-hero-name
              className="type-display text-name leading-[0.82]"
            >
              <span className="sr-only">
                {site.name} — {site.role}
              </span>
              <span aria-hidden="true" className="block">
                <MaskedLine text={FIRST} className="block text-fg" />
                <MaskedLine
                  text={LAST}
                  className="block pl-[7%] text-fg lg:pl-0"
                />
              </span>
            </h1>

            {/* Statement headline */}
            <p className="mt-[clamp(1.25rem,2.4vw,2rem)] max-w-[34ch]">
              <span className="sr-only">{heroHeadline}</span>
              <span
                aria-hidden="true"
                className="font-display text-[clamp(1.4rem,1.15rem+1.6vw,2.5rem)] font-semibold leading-[1.02] tracking-[-0.02em] text-fg-muted"
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
                <Button asChild size="lg" variant="accent">
                  <a href={heroCtaPrimary.href}>
                    {heroCtaPrimary.label}
                    <ArrowUpRight className="size-4" strokeWidth={2} />
                  </a>
                </Button>
              </Magnetic>
              <Magnetic strength={9}>
                <Button asChild size="lg" variant="outline">
                  <a href={heroCtaSecondary.href}>{heroCtaSecondary.label}</a>
                </Button>
              </Magnetic>
            </div>

            {/* Metrics — truthful numbers only */}
            <div
              data-hero-metrics
              className="mt-[clamp(2.25rem,4.5vw,3.5rem)] flex flex-wrap items-center gap-x-8 gap-y-2"
            >
              <MetricStat value={`${projectCount}`} label="Products" />
              <span aria-hidden="true" className="hidden h-4 w-px bg-line-strong sm:block" />
              <MetricStat value={`${heroMetrics.builds}`} label="Builds" />
              <span aria-hidden="true" className="hidden h-4 w-px bg-line-strong sm:block" />
              <span className="type-mono flex items-center gap-2 text-fg-muted">
                <span
                  aria-hidden="true"
                  className="size-1.5 rounded-full bg-pulse-400"
                />
                {heroMetrics.availability}
              </span>
            </div>
          </div>

          {/* ======== RIGHT: cinematic OGL + system status ======== */}
          <div className="lg:col-span-5">
            <div
              data-hero-status
              className="relative mx-auto w-full max-w-[30rem]"
            >
              {/* Grid wash behind the panel, keeps the technical feel */}
              <div
                aria-hidden="true"
                className="grid-lines absolute -inset-x-8 -inset-y-10 -z-10 rounded-card opacity-60 [mask-image:radial-gradient(70%_70%_at_50%_40%,black,transparent)]"
              />
              <div className="rounded-card border border-line bg-surface-strong/70 backdrop-blur-md shadow-[0_24px_70px_-34px_rgba(4,6,11,0.9)]">
                <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
                  <span className="type-mono text-fg-muted">
                    System Status
                  </span>
                  <LiveDot />
                </div>

                {/* Status line */}
                <p className="flex items-center gap-2.5 px-5 pt-4">
                  <span
                    aria-hidden="true"
                    className="relative grid size-2 place-items-center"
                  >
                    <span className="absolute size-2 rounded-full bg-pulse-400" />
                    <span
                      aria-hidden="true"
                      className="absolute size-2 rounded-full bg-pulse-400 [animation:pulse-ring_2.4s_ease-out_infinite]"
                    />
                  </span>
                  <span className="type-mono text-pulse-300">
                    {heroStatus.statusLine}
                  </span>
                </p>

                <dl className="mt-2 divide-y divide-line border-t border-line px-5 pb-5 pt-1">
                  <StatusRow label="Location" value={heroStatus.location} />
                  <StatusRow label="Local Time">
                    <LocalClock />
                  </StatusRow>
                  <StatusRow label="Currently" value={heroStatus.currently} />
                  <StatusRow
                    label="Stack"
                    value={heroStatus.stack.join("  /  ")}
                  />
                </dl>
              </div>
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

/** A mono metric with the number set in the display weight. */
function MetricStat({ value, label }: { value: string; label: string }) {
  return (
    <span className="type-mono flex items-baseline gap-2 text-fg-muted">
      <span className="font-display text-[1.4rem] font-semibold leading-none tracking-[-0.02em] text-fg tabular-nums">
        {value}
      </span>
      {label}
    </span>
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