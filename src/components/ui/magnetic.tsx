"use client";

import { useEffect, useRef, type ReactNode, type ElementType } from "react";
import { usePrefersReducedMotion } from "@/components/animations/motion-primitives";

/* ==========================================================================
   Magnetic — element leans toward the cursor while hovered.

   Owns translate3d on an inner wrapper only. The outer element keeps its
   layout position so surrounding flow never shifts. On touch pointers the
   effect never installs, so taps land exactly where they look.
   ========================================================================== */

type MagneticProps = {
  children: ReactNode;
  className?: string;
  /** Max travel in px at the edge of the element. */
  strength?: number;
  as?: ElementType;
};

export function Magnetic({
  children,
  className,
  strength = 12,
  as: Tag = "div",
}: MagneticProps) {
  const outerRef = useRef<HTMLElement | null>(null);
  const innerRef = useRef<HTMLSpanElement | null>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    // `reduced` is a boolean here (usePrefersReducedMotion already normalises
    // it), and magnetic pull is a desktop-pointer affordance only.
    if (reduced || !window.matchMedia("(pointer: fine)").matches) return;

    let raf = 0;
    const current = { x: 0, y: 0 };
    let target = { x: 0, y: 0 };
    let active = false;

    /* The loop parks itself once the pull has settled, so an idle page is not
       running rAF forever. onEnter restarts it. */
    const render = () => {
      current.x += (target.x - current.x) * 0.16;
      current.y += (target.y - current.y) * 0.16;

      const settled =
        !active &&
        Math.abs(current.x - target.x) < 0.05 &&
        Math.abs(current.y - target.y) < 0.05;

      if (settled) {
        inner.style.transform = "";
        current.x = target.x;
        current.y = target.y;
        raf = 0;
        return;
      }

      inner.style.transform = `translate3d(${current.x}px, ${current.y}px, 0)`;
      raf = requestAnimationFrame(render);
    };

    const kick = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };

    const onMove = (event: PointerEvent) => {
      const rect = outer.getBoundingClientRect();
      const relX = (event.clientX - rect.left) / rect.width - 0.5;
      const relY = (event.clientY - rect.top) / rect.height - 0.5;
      target.x = relX * strength * 2;
      target.y = relY * strength * 2;
    };

    const onEnter = () => {
      active = true;
      kick();
    };
    const onLeave = () => {
      active = false;
      target = { x: 0, y: 0 };
    };

    outer.addEventListener("pointerenter", onEnter);
    outer.addEventListener("pointermove", onMove);
    outer.addEventListener("pointerleave", onLeave);
    kick();

    return () => {
      cancelAnimationFrame(raf);
      outer.removeEventListener("pointerenter", onEnter);
      outer.removeEventListener("pointermove", onMove);
      outer.removeEventListener("pointerleave", onLeave);
      inner.style.transform = "";
    };
  }, [strength, reduced]);

  return (
    <Tag ref={outerRef as never} className={className}>
      <span ref={innerRef} className="inline-flex will-change-transform">
        {children}
      </span>
    </Tag>
  );
}

/* ==========================================================================
   Spotlight — a radial highlight that follows the cursor inside a container.

   Writes two CSS custom properties and nothing else; the visual lives in CSS.
   No transform animation conflicts because this only drives background
   gradients, never layout or transform.
   ========================================================================== */

export function Spotlight({
  children,
  className = "",
  radius = 380,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  radius?: number;
  as?: ElementType;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
      el.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
    };

    el.addEventListener("pointermove", onMove, { passive: true });
    return () => el.removeEventListener("pointermove", onMove);
  }, [reduced]);

  return (
    /* `data-spot="on"` is the hook that makes the glow reachable. See the
       rule in globals.css: the direct child marked `data-spot-surface` gives
       up its opaque background while it is inside a spotlight, so this
       negative-z layer is no longer painted over by a solid card. The child
       keeps its border, shadow and all of its text — only the fill moves
       down here. Without that, the glow renders behind an opaque surface and
       is invisible, which is exactly what it was doing before. */
    <Tag
      ref={ref as never}
      data-spot="on"
      className={`group/spot relative isolate overflow-hidden ${className}`}
      style={{ "--spot-size": `${radius}px` } as React.CSSProperties}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 group-hover/spot:opacity-100"
        style={{
          background:
            "radial-gradient(var(--spot-size, 380px) circle at var(--spot-x, 50%) var(--spot-y, 50%), color-mix(in oklab, var(--accent) 13%, transparent), transparent 68%)",
        }}
      />
      {children}
    </Tag>
  );
}

/* ==========================================================================
   Tilt — subtle 3D rotation on pointer, with a spring-free easing.
   Perspective lives on the parent so children are not re-parented.
   ========================================================================== */

export function Tilt({
  children,
  className = "",
  max = 5,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  max?: number;
  as?: ElementType;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    let raf = 0;
    const current = { rx: 0, ry: 0 };
    let target = { rx: 0, ry: 0 };
    let active = false;

    /* Same parked loop as Magnetic: no rAF while the card is at rest. */
    const render = () => {
      current.rx += (target.rx - current.rx) * 0.12;
      current.ry += (target.ry - current.ry) * 0.12;

      const settled =
        !active &&
        Math.abs(current.rx - target.rx) < 0.05 &&
        Math.abs(current.ry - target.ry) < 0.05;

      if (settled) {
        el.style.transform = "";
        current.rx = target.rx;
        current.ry = target.ry;
        raf = 0;
        return;
      }

      el.style.transform = `perspective(1000px) rotateX(${current.rx}deg) rotateY(${current.ry}deg)`;
      raf = requestAnimationFrame(render);
    };

    const kick = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };

    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      target.ry = px * max;
      target.rx = -py * max;
    };
    const onEnter = () => {
      active = true;
      kick();
    };
    const onLeave = () => {
      active = false;
      target = { rx: 0, ry: 0 };
    };

    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    kick();

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      el.style.transform = "";
    };
  }, [max, reduced]);

  return (
    /* No transition-* here on purpose. The rAF loop above already eases
       (0.12 lerp) in both directions, so a CSS transform transition would be a
       second owner fighting the loop on every frame and would make the pull
       feel like it is dragging through syrup. MOTION.md rule 2. */
    <Tag ref={ref as never} className={className}>
      {children}
    </Tag>
  );
}
