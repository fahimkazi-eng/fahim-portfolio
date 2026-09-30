"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePrefersReducedMotion } from "@/components/animations/motion-primitives";
import { cn } from "@/lib/utils";

/* ==========================================================================
   ProjectSignature

   A generative visual identity, deterministic per project.

   WHY THIS EXISTS
   Both current projects have no screenshots yet, and the site is not allowed
   to invent any. The honest options are a grey box or a fake product mock-up,
   and a fake mock-up is worse: it would depict an interface nobody has seen
   and imply features that may not exist.

   So this draws neither a screenshot nor a product UI. It draws an abstract
   signature seeded from the project's slug — Unimate and FixBondhu resolve to
   different systems, and every project added later gets its own with no code
   change, no admin field, and no design decision required.

   The construction, deliberately, is composed rather than noisy:
     - a seeded centre, with the node field arranged on orbits around it
       rather than scattered, so every frame reads as a system
     - depth, so nearer nodes are larger, brighter and travel further
     - concentric arcs on independent periods, giving the mark a structure
       that survives any amount of pointer movement
     - proximity links, drawn only between nodes that are actually near

   It is 2D canvas, not WebGL. A constellation of ~50 nodes does not need a
   GPU, and the page already spends its one WebGL budget on the hero field.

   PERFORMANCE
     - No React state. Pointer position and time live in refs; the rAF loop
       writes to the 2D context directly.
     - Pauses completely when the element leaves the viewport, and after the
       pointer goes idle, so an off-screen card costs nothing.
     - Reduced motion draws exactly one static frame and starts no loop.
     - Backing store is sized from the element with a ResizeObserver and DPR
       capped at 1.75. The canvas is sized with the width/height ATTRIBUTES
       and laid out by CSS, never by an inline style — an inline pixel size
       would override the CSS box, which is exactly the bug that pinned the
       hero's WebGL field at 300x150.
   ========================================================================== */

/* ---- deterministic randomness ----------------------------------------- */

/** FNV-1a. Same slug in, same artwork out, on every machine and every reload. */
function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Node = {
  /** Orbit centre, normalised. */
  cx: number;
  cy: number;
  /** Orbit radii, normalised. */
  rx: number;
  ry: number;
  /** Radians per second. */
  speed: number;
  phase: number;
  /** 0 far … 1 near. Drives size, opacity and travel. */
  depth: number;
};

function buildNodes(rand: () => number, count: number): Node[] {
  const nodes: Node[] = [];
  for (let i = 0; i < count; i += 1) {
    const depth = 0.3 + rand() * 0.7;
    // The whole system leans toward one off-centre focus.
    nodes.push({
      cx: 0.34 + rand() * 0.32,
      cy: 0.3 + rand() * 0.4,
      rx: (0.08 + rand() * 0.34) * (0.55 + depth * 0.75),
      ry: (0.06 + rand() * 0.28) * (0.55 + depth * 0.75),
      // Depth is also velocity: the near field parallaxes, the far field
      // barely moves. That difference is what makes it read as a volume.
      speed: (0.045 + rand() * 0.075) * (0.35 + depth) * (rand() > 0.5 ? 1 : -1),
      phase: rand() * Math.PI * 2,
      depth,
    });
  }
  return nodes;
}

function buildArcs(rand: () => number, count: number) {
  return Array.from({ length: count }, (_, i) => ({
    radius: 0.12 + (i / count) * 0.3 + rand() * 0.05,
    speed: (0.03 + rand() * 0.06) * (rand() > 0.5 ? 1 : -1),
    phase: rand() * Math.PI * 2,
    start: rand() * Math.PI * 2,
    sweep: 0.7 + rand() * 2.1,
  }));
}

/* --------------------------------------------------------------------------
   Component
   -------------------------------------------------------------------------- */

type ProjectSignatureProps = {
  /** Project slug. The only input that determines the artwork. */
  seed: string;
  /** Used for the ghost typographic layer. */
  title: string;
  className?: string;
  intensity?: number;
};

export function ProjectSignature({
  seed,
  title,
  className,
  intensity = 1,
}: ProjectSignatureProps) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reduced = usePrefersReducedMotion();

  /* ---- scroll-linked depth on the WRAPPER ---------------------------
     The canvas's own pixels are driven by the loop below. Rotating and
     scaling the wrapper keeps that a one-property-higher concern, so
     ScrollTrigger and the rAF loop never touch the same element. */
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || reduced) return;
    gsap.registerPlugin(ScrollTrigger);

    const tween = gsap.fromTo(
      frame,
      { rotate: -3.5, scale: 0.94 },
      {
        rotate: 3.5,
        scale: 1.04,
        ease: "none",
        scrollTrigger: {
          trigger: frame,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.7,
        },
      },
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [reduced]);

  /* ---- the artwork --------------------------------------------------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    const frame = frameRef.current;
    if (!canvas || !frame) return;

    const maybeCtx = canvas.getContext("2d");
    if (!maybeCtx) return;
    // Annotated rather than inferred: the draw function below is a hoisted
    // declaration, and TypeScript will not carry a `!== null` narrowing into
    // one. The explicit type makes ctx non-nullable everywhere.
    const ctx: CanvasRenderingContext2D = maybeCtx;

    const rand = mulberry32(hashSeed(seed));

    // Node budget scales with the box, within a sane band.
    const area = frame.clientWidth * frame.clientHeight;
    const count = Math.max(22, Math.min(58, Math.round(area / 11000)));
    const nodes = buildNodes(rand, count);
    const arcs = buildArcs(rand, 4);

    /* Colours are read from the CSS custom properties rather than hard-coded,
       so the mark follows the theme automatically. Re-read when the theme
       class changes, which is the only way this can drift. */
    let accent = "#f5410f";
    let ink = "#efede7";
    const readColors = () => {
      const cs = getComputedStyle(document.documentElement);
      accent = cs.getPropertyValue("--accent").trim() || accent;
      ink = cs.getPropertyValue("--fg").trim() || ink;
    };
    readColors();

    let width = 0;
    let height = 0;
    let dpr = 1;

    const resize = () => {
      const rect = frame.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      width = rect.width;
      height = rect.height;
      // Attributes only. CSS owns the layout box.
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    };
    resize();

    const ro = new ResizeObserver(() => {
      resize();
      if (reduced) drawFrame(0, true);
    });
    ro.observe(frame);

    /* Pointer, damped. `active` gates the proximity response. */
    const pointer = { x: -999, y: -999, active: false };
    const onMove = (event: PointerEvent) => {
      const rect = frame.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
    };
    const onLeave = () => {
      pointer.active = false;
      pointer.x = -999;
      pointer.y = -999;
    };
    frame.addEventListener("pointermove", onMove, { passive: true });
    frame.addEventListener("pointerleave", onLeave);

    const smooth = { x: -999, y: -999 };

    function drawFrame(t: number, still = false) {
      if (!width || !height) return;

      const min = Math.min(width, height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // Damp the pointer toward its target.
      if (pointer.active) {
        smooth.x += (pointer.x - smooth.x) * 0.12;
        smooth.y += (pointer.y - smooth.y) * 0.12;
      }

      /* ---- concentric arcs: the structural skeleton ---- */
      ctx.lineCap = "round";
      for (let i = 0; i < arcs.length; i += 1) {
        const arc = arcs[i];
        const a = arc.phase + t * arc.speed;
        ctx.beginPath();
        ctx.arc(
          width * 0.5,
          height * 0.5,
          arc.radius * min,
          a + arc.start,
          a + arc.start + arc.sweep,
        );
        ctx.strokeStyle = accent;
        ctx.globalAlpha = 0.1 + (i % 2) * 0.05;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      /* ---- node field on seeded orbits ---- */
      const px: number[] = [];
      const py: number[] = [];
      for (let i = 0; i < nodes.length; i += 1) {
        const n = nodes[i];
        const a = n.phase + t * n.speed;
        let x = (n.cx + Math.cos(a) * n.rx) * width;
        let y = (n.cy + Math.sin(a) * n.ry) * height;

        // Proximity response: nodes near the pointer are pushed out and lit.
        if (pointer.active) {
          const dx = x - smooth.x;
          const dy = y - smooth.y;
          const d = Math.hypot(dx, dy);
          const reach = min * 0.26;
          if (d < reach && d > 0.001) {
            const push = ((reach - d) / reach) ** 2 * 15 * n.depth;
            x += (dx / d) * push;
            y += (dy / d) * push;
          }
        }

        px.push(x);
        py.push(y);
      }

      /* ---- proximity links ---- */
      const linkReach = min * 0.2;
      ctx.lineWidth = 1;
      for (let i = 0; i < px.length; i += 1) {
        for (let j = i + 1; j < px.length; j += 1) {
          const dx = px[i] - px[j];
          const dy = py[i] - py[j];
          const d = Math.hypot(dx, dy);
          if (d > linkReach) continue;
          const falloff = 1 - d / linkReach;
          const depth = (nodes[i].depth + nodes[j].depth) / 2;
          ctx.beginPath();
          ctx.moveTo(px[i], py[i]);
          ctx.lineTo(px[j], py[j]);
          ctx.strokeStyle = ink;
          ctx.globalAlpha = falloff * 0.16 * depth;
          ctx.stroke();
        }
      }

      /* ---- nodes ---- */
      for (let i = 0; i < px.length; i += 1) {
        const n = nodes[i];
        const r = (0.9 + n.depth * 2.4) * (min / 420);
        let glow = 0.5 + n.depth * 0.5;
        if (pointer.active) {
          const d = Math.hypot(px[i] - smooth.x, py[i] - smooth.y);
          const reach = min * 0.26;
          if (d < reach) glow += (1 - d / reach) * 0.9;
        }
        ctx.beginPath();
        ctx.arc(px[i], py[i], r * (1 + (glow - 0.5) * 0.4), 0, Math.PI * 2);
        ctx.fillStyle = glow > 1 ? accent : ink;
        ctx.globalAlpha = Math.min(1, 0.22 + n.depth * 0.5 + (glow - 0.5) * 0.4);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      void still;
    }

    /* ---- loop, with idle and offscreen parking ---- */
    let raf = 0;
    let last = 0;
    let visible = true;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const t = now / 1000;
      // Skip drawing when nothing changed and the pointer is resting, so an
      // idle card costs no paint at all.
      if (now - last < 40 && !pointer.active) return;
      last = now;
      drawFrame(t * intensity);
    };

    // Declared out here so the cleanup below can reach it: the observer only
    // exists on the animated path, but teardown runs on both.
    let io: IntersectionObserver | null = null;

    if (reduced) {
      // One frame, and that is the whole effect.
      drawFrame(0, true);
    } else {
      io = new IntersectionObserver(
        (entries) => {
          visible = entries[0]?.isIntersecting ?? true;
          if (visible && !raf) {
            last = 0;
            raf = requestAnimationFrame(tick);
          } else if (!visible && raf) {
            cancelAnimationFrame(raf);
            raf = 0;
          }
        },
        { threshold: 0 },
      );
      io.observe(frame);
      raf = requestAnimationFrame(tick);
    }

    const mo = new MutationObserver(() => {
      readColors();
      if (reduced) drawFrame(0, true);
    });
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style"],
    });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io?.disconnect();
      mo.disconnect();
      frame.removeEventListener("pointermove", onMove);
      frame.removeEventListener("pointerleave", onLeave);
    };
  }, [seed, intensity, reduced]);

  const ghost = title.replace(/[^a-z0-9]/gi, "").slice(0, 7).toUpperCase();

  return (
    <div
      ref={frameRef}
      className={cn("group/sig relative isolate overflow-hidden", className)}
    >
      {/* Ghost type. The project's own name, at display scale, behind the
          drawing. Decorative — the title is always present as real text in
          the surrounding markup. */}
      <span
        aria-hidden="true"
        className="type-display pointer-events-none absolute inset-0 flex select-none items-center justify-center text-[clamp(4rem,17cqw,13rem)] leading-none text-fg/[0.05]"
      >
        {ghost}
      </span>

      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
      />
    </div>
  );
}
