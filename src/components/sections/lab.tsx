"use client";

import dynamic from "next/dynamic";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowUpRight } from "lucide-react";
import { Section, SectionHeading } from "@/components/ui/card";
import { SplitText } from "@/components/animations/split-text";
import { Stagger, usePrefersReducedMotion } from "@/components/animations/motion-primitives";
import { Magnetic } from "@/components/ui/magnetic";
import { cn } from "@/lib/utils";

/* The only WebGL demo: isolated behind a dynamic import because OGL is a
   browser-only dependency and must stay out of the server bundle. The other
   five demos are plain DOM + Canvas2D and import statically. */
const ShaderCanvas = dynamic(() => import("./lab/experiments/shader-demo"), {
  ssr: false,
});

/* ==========================================================================
   Lab (06) — the playground, reference composition.

   Six self-contained experiments, each one actually interactive rather than a
   screenshot of an idea: Magnetic button, text distortion, cursor trail,
   shader field, particle field and a scroll-linked reveal.

   Rules held here (see MOTION.md):
   - Each demo owns its own loop and its own element(s). Nothing here writes
     to a property any page-level animation also writes.
   - Canvas demos pause their rAF loop while off-screen.
   - prefers-reduced-motion renders the static (still correct) state.
   - Coarse pointers skip pointer-tracking demos, not the whole lab.
   ========================================================================== */

const EXPERIMENTS: { index: string; title: string; desc: string }[] = [
  {
    index: "01",
    title: "Magnetic Button",
    desc: "The CTA leans toward the pointer. Pure transform, disabled under reduced motion.",
  },
  {
    index: "02",
    title: "Text Distortion",
    desc: "Glyphs twist on hover — CSS keyframes driven by per-character variables.",
  },
  {
    index: "03",
    title: "Cursor Trail",
    desc: "A fading pointer trail on Canvas2D, capped length, touch + reduced-motion aware.",
  },
  {
    index: "04",
    title: "Shader Experiment",
    desc: "A WebGL plasma field fed by the site accent — OGL behind a CSS fallback.",
  },
  {
    index: "05",
    title: "Particle Field",
    desc: "Drifting particles that flinch away from the pointer. One rAF loop, DPR-clamped.",
  },
  {
    index: "06",
    title: "Scroll Experiment",
    desc: "Letter-spacing and a progress hairline scrub with the page scroll.",
  },
];

export function LabSection() {
  return (
    <Section id="lab">
      <SectionHeading
        index="/ 06"
        eyebrow="Lab / Playground"
        title={<SplitText text="Tiny experiments." duration={1} />}
        lede="A small laboratory of isolated micro-interactions and creative bits. Each one is a real working demo, not a picture of one."
      />

      <Stagger
        step={0.07}
        className="mt-[clamp(2rem,5vw,4rem)] grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        <LabPanel {...EXPERIMENTS[0]}>
          <MagneticDemo />
        </LabPanel>
        <LabPanel {...EXPERIMENTS[1]}>
          <DistortDemo />
        </LabPanel>
        <LabPanel {...EXPERIMENTS[2]}>
          <TrailDemo />
        </LabPanel>
        <LabPanel {...EXPERIMENTS[3]}>
          <ShaderCanvas className="absolute inset-0 z-0 h-full w-full" />
          <p className="pointer-events-none absolute inset-x-0 bottom-3 z-10 text-center type-mono text-fg-subtle">
            GET /shader
          </p>
        </LabPanel>
        <LabPanel {...EXPERIMENTS[4]}>
          <ParticleDemo />
        </LabPanel>
        <LabPanel {...EXPERIMENTS[5]}>
          <ScrollDemo />
        </LabPanel>
      </Stagger>
    </Section>
  );
}

/* --------------------------------------------------------------------------
   Panel shell
   -------------------------------------------------------------------------- */

function LabPanel({
  index,
  title,
  desc,
  children,
}: {
  index: string;
  title: string;
  desc: string;
  children: ReactNode;
}) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-card border border-line bg-surface transition-colors duration-500 hover:border-accent/50">
      <div className="flex items-center gap-3 px-5 pt-4">
        <span className="type-mono text-accent tabular-nums">{index}</span>
        <h3 className="font-display text-h4 tracking-tight text-fg">{title}</h3>
        <span aria-hidden="true" className="ml-auto h-px w-8 bg-line transition-colors duration-500 group-hover:bg-accent/50" />
      </div>
      <p className="px-5 pt-2 text-sm leading-relaxed text-fg-muted">{desc}</p>
      <div className="relative mt-4 flex min-h-[15.5rem] flex-1 flex-col overflow-hidden border-t border-line bg-canvas/40">
        {children}
      </div>
    </article>
  );
}

/* IntersectionObserver-driven visibility: canvas loops pause off-screen. */
function usePanelVisible<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      const frame = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(frame);
    }
    const ob = new IntersectionObserver(
      (entries) => setVisible(entries[0]?.isIntersecting ?? false),
      { rootMargin: "160px 0px" },
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, []);
  return { ref, visible };
}

/** Reads the current accent (e.g. electric blue in dark mode) as rgb floats. */
function readAccentRGB(): [number, number, number] {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--accent")
    .trim();
  const hex = /^#([0-9a-f]{6})$/i.exec(raw)?.[1];
  if (hex) {
    const n = parseInt(hex, 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  return [0.24, 0.42, 0.95];
}

/* --------------------------------------------------------------------------
   01 — Magnetic button
   -------------------------------------------------------------------------- */

function MagneticDemo() {
  return (
    <div className="grid flex-1 place-items-center">
      <Magnetic strength={24}>
        <button
          type="button"
          className="inline-flex h-14 items-center gap-2 rounded-full bg-fg pl-7 pr-6 text-[0.95rem] font-medium text-canvas transition-colors duration-300 hover:bg-accent hover:text-accent-fg"
        >
          Hover me
          <ArrowUpRight className="size-4" strokeWidth={2} />
        </button>
      </Magnetic>
      <span className="type-mono absolute bottom-3 left-5 text-fg-subtle">
        translate on proximity
      </span>
    </div>
  );
}

/* --------------------------------------------------------------------------
   02 — Text distortion (CSS keyframes, per-character vars)
   -------------------------------------------------------------------------- */

function DistortDemo() {
  const [running, setRunning] = useState(false);
  const reduced = usePrefersReducedMotion();
  const WORD = "DISTORT";

  return (
    <div
      className="grid flex-1 cursor-default select-none place-items-center"
      onMouseEnter={() => setRunning(true)}
      onMouseLeave={() => setRunning(false)}
      onFocus={() => setRunning(true)}
      onBlur={() => setRunning(false)}
      tabIndex={0}
    >
      <span
        className={cn(
          "inline-flex font-display text-[clamp(2.4rem,8vw,4.2rem)] font-bold leading-none tracking-tight text-fg",
          running && !reduced && "distort-run",
        )}
        aria-label={WORD}
      >
        {Array.from(WORD).map((char, i) => (
          <span
            key={`${char}-${i}`}
            aria-hidden="true"
            className="d-glyph inline-block"
            style={{ ["--ch-i" as string]: String(i) }}
          >
            {char}
          </span>
        ))}
      </span>
      <span className="type-mono absolute bottom-3 left-5 text-fg-subtle">
        hover to distort
      </span>
    </div>
  );
}

/* --------------------------------------------------------------------------
   03 — Cursor trail (Canvas2D)
   -------------------------------------------------------------------------- */

function TrailDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const { visible } = usePanelVisible<HTMLDivElement>();
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root || reduced || !visible) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const points: { x: number; y: number; born: number }[] = [];
    let raf = 0;
    const accent = readAccentRGB();

    const resize = () => {
      const r = root.getBoundingClientRect();
      w = r.width;
      h = r.height;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(root);

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      points.push({ x: e.clientX - r.left, y: e.clientY - r.top, born: performance.now() });
      if (points.length > 40) points.shift();
    };
    canvas.addEventListener("pointermove", onMove, { passive: true });

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      ctx.clearRect(0, 0, w, h);
      const age = 650; // ms a point lives
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const t = (now - p.born) / age;
        if (t >= 1) {
          points.splice(i, 1);
          i--;
          continue;
        }
        const fade = 1 - t;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.5 + t * 7, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${(accent[0] * 255) | 0},${(accent[1] * 255) | 0},${(accent[2] * 255) | 0},${(fade * 0.55).toFixed(3)})`;
        ctx.fill();
      }
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointermove", onMove);
    };
  }, [reduced, visible]);

  return (
    <div ref={rootRef} className="relative flex-1">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <span className="type-mono absolute bottom-3 left-5 text-fg-subtle">
        move your cursor
      </span>
    </div>
  );
}

/* --------------------------------------------------------------------------
   05 — Particle field (Canvas2D, pointer repulsion)
   -------------------------------------------------------------------------- */

function ParticleDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const { visible } = usePanelVisible<HTMLDivElement>();
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root || !visible) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const COUNT = reduced ? 0 : 64;
    type P = { x: number; y: number; vx: number; vy: number; r: number; ph: number };
    const parts: P[] = [];
    const mouse = { x: -1e4, y: -1e4 };

    const seed = () => {
      parts.length = 0;
      for (let i = 0; i < COUNT; i++) {
        parts.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          r: 1 + Math.random() * 1.8,
          ph: Math.random() * Math.PI * 2,
        });
      }
    };

    const resize = () => {
      const rect = root.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(root);

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    const onLeave = () => {
      mouse.x = -1e4;
      mouse.y = -1e4;
    };
    canvas.addEventListener("pointermove", onMove, { passive: true });
    canvas.addEventListener("pointerleave", onLeave);

    const accent = readAccentRGB();
    let raf = 0;
    let last = performance.now();

    // Reduced motion: draw one still frame, no loop.
    const drawStill = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${(accent[0] * 255) | 0},${(accent[1] * 255) | 0},${(accent[2] * 255) | 0},0.5)`;
        ctx.fill();
      }
    };
    if (reduced) {
      drawStill();
      return () => {
        ro.disconnect();
        canvas.removeEventListener("pointermove", onMove);
        canvas.removeEventListener("pointerleave", onLeave);
      };
    }

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(40, now - last);
      last = now;
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 90 * 90) {
          const d = Math.sqrt(d2) || 1;
          const f = ((90 - d) / 90) * 0.9;
          p.vx += (dx / d) * f * 0.55;
          p.vy += (dy / d) * f * 0.55;
        }
        p.vx *= 0.985;
        p.vy *= 0.985;
        p.x += p.vx * (dt / 16.666);
        p.y += p.vy * (dt / 16.666);
        if (p.x < -6) p.x = w + 6;
        if (p.x > w + 6) p.x = -6;
        if (p.y < -6) p.y = h + 6;
        if (p.y > h + 6) p.y = -6;
        const twinkle = 0.25 + 0.5 * (0.5 + 0.5 * Math.sin(now / 900 + p.ph));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${(accent[0] * 255) | 0},${(accent[1] * 255) | 0},${(accent[2] * 255) | 0},${twinkle.toFixed(3)})`;
        ctx.fill();
      }
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }, [reduced, visible]);

  return (
    <div ref={rootRef} className="relative flex-1">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <span className="type-mono absolute bottom-3 left-5 text-fg-subtle">
        {reduced ? "static field" : "particles flinch from the pointer"}
      </span>
    </div>
  );
}

/* --------------------------------------------------------------------------
   06 — Scroll experiment (scrub-linked)
   -------------------------------------------------------------------------- */

function ScrollDemo() {
  const rootRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const phraseRef = useRef<HTMLSpanElement>(null);
  const reduced = usePrefersReducedMotion();

  useLayoutEffect(() => {
    const root = rootRef.current;
    const bar = barRef.current;
    const phrase = phraseRef.current;
    if (!root || !bar || !phrase) return;

    if (reduced) {
      bar.style.transform = "scaleX(0.5)";
      return;
    }

    const ctx = gsap.context(() => {
      gsap.registerPlugin(ScrollTrigger);
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root,
          start: "top 85%",
          end: "bottom 30%",
          scrub: true,
        },
      });
      tl.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: 1 }, 0).fromTo(
        phrase,
        { letterSpacing: "0.28em", opacity: 0.2 },
        { letterSpacing: "0.02em", opacity: 1, duration: 1 },
        0,
      );
    }, root);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <div ref={rootRef} className="flex flex-1 flex-col items-center justify-center gap-7 px-6">
      <span
        ref={phraseRef}
        className="will-change-[letter-spacing,opacity] font-display text-[clamp(1.1rem,3vw,1.6rem)] font-semibold uppercase tracking-[0.02em] text-fg"
      >
        Scroll-linked
      </span>
      <div className="flex w-full flex-col gap-2">
        <div className="h-px w-full bg-line">
          <div ref={barRef} className="h-full origin-left bg-accent" />
        </div>
        <span className="type-mono text-[0.6875rem] text-fg-subtle">
          scrub progress / 100
        </span>
      </div>
    </div>
  );
}