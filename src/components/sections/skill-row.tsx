"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import type { Skill } from "@/lib/db/schema";
import { usePrefersReducedMotion } from "@/components/animations/motion-primitives";
import { cn } from "@/lib/utils";

/**
 * One skill row. The hover reveal is a clip-path wipe driven by a single
 * GSAP timeline on the row's own overflow layer — no shared parent, so it
 * never fights the section-level reveal.
 */
export function SplitSkillRow({ skill }: { skill: Skill }) {
  const rowRef = useRef<HTMLLIElement | null>(null);
  const wipeRef = useRef<HTMLSpanElement | null>(null);
  const reduced = usePrefersReducedMotion();

  useLayoutEffect(() => {
    const row = rowRef.current;
    const wipe = wipeRef.current;
    if (!row || !wipe || reduced) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const set = gsap.quickSetter(wipe, "clipPath");
    const quickTo = gsap.quickTo(row, "x", { duration: 0.4, ease: "power3.out" });

    const onMove = (event: PointerEvent) => {
      const rect = row.getBoundingClientRect();
      const x = event.clientX - rect.left;
      set(`inset(0 ${100 - (x / rect.width) * 100}% 0 0)`);
      quickTo((x / rect.width - 0.5) * 14);
    };

    const onEnter = () => {
      gsap.to(wipe, { opacity: 1, duration: 0.25 });
    };
    const onLeave = () => {
      gsap.to(wipe, { opacity: 0, duration: 0.35 });
      set("inset(0 100% 0 0)");
      quickTo(0);
    };

    row.addEventListener("pointerenter", onEnter);
    row.addEventListener("pointermove", onMove);
    row.addEventListener("pointerleave", onLeave);

    return () => {
      row.removeEventListener("pointerenter", onEnter);
      row.removeEventListener("pointermove", onMove);
      row.removeEventListener("pointerleave", onLeave);
      gsap.set(row, { clearProps: "transform" });
    };
  }, [reduced]);

  return (
    <li
      ref={rowRef}
      className={cn(
        "group relative isolate flex items-center justify-between gap-4 overflow-hidden bg-canvas px-5 py-4",
        "transition-colors duration-300 hover:bg-transparent",
      )}
    >
      {/* Wipe fill — sits under the content, above the row background. */}
      <span
        ref={wipeRef}
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-fg/[0.04] opacity-0"
        style={{ clipPath: "inset(0 100% 0 0)" }}
      />

      <span className="text-body text-fg">{skill.name}</span>

      <span className="flex items-center gap-3">
        {skill.note ? (
          <span className="hidden text-[0.75rem] text-fg-subtle sm:inline">
            {skill.note}
          </span>
        ) : null}
        {skill.level !== null ? (
          <span
            className="flex items-center gap-1.5"
            aria-label={`Self-assessed level ${skill.level} out of 100`}
          >
            <span aria-hidden="true" className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-3.5 w-[3px] rounded-full transition-colors duration-300",
                    skill.level! > i * 20 ? "bg-accent" : "bg-line-strong",
                  )}
                />
              ))}
            </span>
          </span>
        ) : (
          <span aria-hidden="true" className="type-mono text-fg-subtle">
            —
          </span>
        )}
      </span>
    </li>
  );
}
