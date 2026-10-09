"use client";

import { useEffect, useRef } from "react";
import { motionReduced } from "@/components/animations/motion-primitives";

/* ==========================================================================
   Cursor — a single-element custom cursor driven by refs and rAF. No React
   state: this updates on every pointer move. Touch/coarse pointers remain
   native.
   ========================================================================== */

type CursorMode = "default" | "hover" | "text" | "view";

const LABELS: Record<Exclude<CursorMode, "default">, string> = {
  hover: "",
  text: "",
  view: "View",
};

export function CustomCursor() {
  const ringRef = useRef<HTMLDivElement | null>(null);
  const labelRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)");
    if (!fine.matches || motionReduced()) return;

    const ring = ringRef.current;
    if (!ring) return;

    let mounted = true;
    let raf = 0;

    const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ringPos = { ...pointer };
    let scale = 1;
    let targetScale = 1;
    let mode: CursorMode = "default";

    const setMode = (next: CursorMode) => {
      if (next === mode) return;
      mode = next;
      targetScale = next === "hover" ? 1.7 : next === "text" ? 0.4 : next === "view" ? 2.7 : 1;
      const label = labelRef.current;
      if (label) {
        const text = next === "default" ? "" : LABELS[next];
        label.textContent = text;
        label.dataset.visible = text ? "true" : "false";
      }
      ring.dataset.mode = next;
    };

    const onMove = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      ring.style.opacity = "1";

      const target = event.target as HTMLElement | null;
      if (!target) return;

      const interactive = target.closest<HTMLElement>(
        "a,button,[role='button'],summary,input:not([type='range']),[data-cursor]",
      );
      if (!interactive) {
        setMode("default");
        return;
      }

      const explicit = interactive.dataset.cursor as CursorMode | undefined;
      if (explicit) {
        setMode(explicit);
        return;
      }

      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        setMode("text");
        return;
      }
      setMode("hover");
    };

    const onDown = () => {
      ring.dataset.down = "true";
    };
    const onUp = () => {
      ring.dataset.down = "false";
    };
    const onLeave = () => {
      ring.style.opacity = "0";
    };

    const loop = () => {
      if (!mounted) return;
      raf = requestAnimationFrame(loop);

      ringPos.x += (pointer.x - ringPos.x) * 0.4;
      ringPos.y += (pointer.y - ringPos.y) * 0.4;
      scale += (targetScale - scale) * 0.24;

      ring.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0) translate(-50%, -50%) scale(${scale})`;
    };
    raf = requestAnimationFrame(loop);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    return () => {
      mounted = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[70] hidden [@media(pointer:fine)]:block">
      <div
        ref={ringRef}
        data-mode="default"
        data-down="false"
        className="absolute left-0 top-0 grid size-10 place-items-center rounded-full border border-fg/30 bg-canvas/60 opacity-0 backdrop-blur-[2px] transition-[background-color,border-color] duration-150 data-[mode=view]:border-accent data-[mode=view]:bg-accent/20"
      >
        <span
          ref={labelRef}
          className="type-mono text-[9px] text-accent opacity-0 transition-opacity duration-100 data-[visible=true]:opacity-100"
        />
      </div>
    </div>
  );
}
