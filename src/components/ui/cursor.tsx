"use client";

import { useEffect, useRef } from "react";

/* ==========================================================================
   Cursor — a two-part custom cursor (dot + ring) driven entirely by refs and
   rAF. No React state: this updates on every pointer move, and re-rendering
   the tree 60–120 times a second would be indefensible.

   Touch / coarse pointers: nothing renders. The native cursor and native
   tap targets are left completely alone.
   ========================================================================== */

type CursorMode = "default" | "hover" | "text" | "view";

const LABELS: Record<Exclude<CursorMode, "default">, string> = {
  hover: "",
  text: "",
  view: "View",
};

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const labelRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || reduced.matches) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let mounted = true;
    let raf = 0;

    const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const dotPos = { ...pointer };
    const ringPos = { ...pointer };
    let scale = 1;
    let targetScale = 1;
    let mode: CursorMode = "default";

    const setMode = (next: CursorMode) => {
      if (next === mode) return;
      mode = next;
      targetScale = next === "hover" ? 1.7 : next === "text" ? 0.4 : next === "view" ? 2.7 : 1;
      const label = labelRef.current;
      // "default" has no label; every other mode has one.
      if (label) {
        const text = next === "default" ? "" : LABELS[next];
        label.textContent = text;
        // The label is opacity-0 by default and only lifts on
        // data-visible=true. This is the only place that flag is set, so
        // without it the label stays invisible forever.
        label.dataset.visible = text ? "true" : "false";
      }
      ring.dataset.mode = next;
      dot.dataset.mode = next;
    };

    const onMove = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      dot.style.opacity = "1";
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
      dot.dataset.down = "true";
      ring.dataset.down = "true";
    };
    const onUp = () => {
      dot.dataset.down = "false";
      ring.dataset.down = "false";
    };
    const onLeave = () => {
      dot.style.opacity = "0";
      ring.style.opacity = "0";
    };

    const loop = () => {
      if (!mounted) return;
      raf = requestAnimationFrame(loop);

      // Dot is tight to the pointer, ring lags — the offset between them is
      // what makes it feel like a physical object with mass.
      dotPos.x += (pointer.x - dotPos.x) * 0.55;
      dotPos.y += (pointer.y - dotPos.y) * 0.55;
      ringPos.x += (pointer.x - ringPos.x) * 0.16;
      ringPos.y += (pointer.y - ringPos.y) * 0.16;
      scale += (targetScale - scale) * 0.18;

      dot.style.transform = `translate3d(${dotPos.x}px, ${dotPos.y}px, 0) translate(-50%, -50%)`;
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
        className="absolute left-0 top-0 grid size-10 place-items-center rounded-full border border-fg/25 opacity-0 backdrop-blur-[1px] transition-[background-color,border-color] duration-300 data-[mode=view]:border-accent data-[mode=view]:bg-accent/10"
      >
        <span
          ref={labelRef}
          className="type-mono text-[9px] text-accent opacity-0 transition-opacity duration-200 data-[visible=true]:opacity-100"
        />
      </div>
      <div
        ref={dotRef}
        data-mode="default"
        data-down="false"
        className="absolute left-0 top-0 size-1.5 rounded-full bg-accent opacity-0 transition-transform duration-150 data-[mode=text]:opacity-0 data-[down=true]:scale-50"
      />
    </div>
  );
}
