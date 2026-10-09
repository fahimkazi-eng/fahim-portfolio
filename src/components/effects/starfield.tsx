"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/components/animations/motion-primitives";

/* ==========================================================================
   HeroStarfield — a depth-layered Canvas2D star field for the hero.

   Why canvas and not DOM: three parallax star tiers plus twinkle plus the
   occasional shooting star would be hundreds of nodes. One canvas draws all
   of it in a single pass and costs one composite.

   Contract (matches the rest of the motion system):
   - One rAF loop, capped at ~45fps, that pauses while the hero is off-screen.
   - devicePixelRatio capped at 1.5 — this is atmosphere, not a retina demo.
   - prefers-reduced-motion / kf-motion "off" paints one correct still frame
     and never starts the loop.
   - Pointer parallax is subtle and layered by depth; it never tracks the text.
   ========================================================================== */

type Star = {
  x: number;
  y: number;
  r: number;
  depth: number;
  ph: number;
  tw: number;
};

type Shot = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
};

export function HeroStarfield({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let w = 0;
    let h = 0;
    let stars: Star[] = [];
    const shots: Shot[] = [];

    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

    const build = () => {
      const count = Math.round(
        Math.min(210, Math.max(80, (w * h) / 9500)),
      );
      stars = Array.from({ length: count }, () => {
        const depth = Math.random();
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          r: 0.4 + depth * 1.3,
          depth,
          ph: Math.random() * Math.PI * 2,
          tw: 0.6 + Math.random() * 1.6,
        };
      });
    };

    const resize = () => {
      const parent = canvas.parentElement;
      w = parent?.clientWidth || window.innerWidth;
      h = parent?.clientHeight || window.innerHeight;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    };
    resize();

    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const onPointer = (event: PointerEvent) => {
      pointer.tx = (event.clientX / window.innerWidth - 0.5) * 2;
      pointer.ty = (event.clientY / window.innerHeight - 0.5) * 2;
    };
    if (!reduced) {
      window.addEventListener("pointermove", onPointer, { passive: true });
    }

    const draw = (now: number) => {
      ctx.clearRect(0, 0, w, h);

      pointer.x += (pointer.tx - pointer.x) * 0.045;
      pointer.y += (pointer.ty - pointer.y) * 0.045;

      for (const s of stars) {
        const par = s.depth * 12;
        const px = s.x + pointer.x * par;
        const py = s.y + pointer.y * par;
        const tw = reduced
          ? 1
          : 0.55 + 0.45 * Math.sin(now / (700 * s.tw) + s.ph);
        const alpha = (0.22 + s.depth * 0.6) * tw;

        ctx.beginPath();
        ctx.arc(px, py, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(228,234,255,${alpha.toFixed(3)})`;
        ctx.fill();

        if (s.depth > 0.82) {
          ctx.beginPath();
          ctx.arc(px, py, s.r * 3.4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(150,178,255,${(alpha * 0.14).toFixed(3)})`;
          ctx.fill();
        }
      }

      if (reduced) return;

      if (shots.length < 1 && Math.random() < 0.003) {
        shots.push({
          x: w * (0.4 + Math.random() * 0.55),
          y: h * (0.04 + Math.random() * 0.3),
          vx: -(3.1 + Math.random() * 2.1),
          vy: 1.5 + Math.random() * 1.3,
          life: 0,
          max: 1100 + Math.random() * 600,
        });
      }

      for (let i = shots.length - 1; i >= 0; i--) {
        const sh = shots[i];
        sh.life += 16.7;
        sh.x += sh.vx * 3;
        sh.y += sh.vy * 3;
        const t = sh.life / sh.max;
        if (t >= 1) {
          shots.splice(i, 1);
          continue;
        }
        const tx = sh.x - sh.vx * 16;
        const ty = sh.y - sh.vy * 16;
        const grad = ctx.createLinearGradient(sh.x, sh.y, tx, ty);
        grad.addColorStop(0, `rgba(224,234,255,${(0.9 * (1 - t)).toFixed(3)})`);
        grad.addColorStop(1, "rgba(224,234,255,0)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(sh.x, sh.y);
        ctx.lineTo(tx, ty);
        ctx.stroke();
      }
    };

    if (reduced) {
      draw(0);
      return () => {
        ro.disconnect();
        window.removeEventListener("pointermove", onPointer);
      };
    }

    let visible = true;
    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? false;
      },
      { rootMargin: "120px" },
    );
    io.observe(canvas);

    let raf = 0;
    let last = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible) return;
      if (now - last < 1000 / 45) return;
      last = now;
      draw(now);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onPointer);
    };
  }, [reduced]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={
        className ?? "pointer-events-none absolute inset-0 h-full w-full"
      }
    />
  );
}
