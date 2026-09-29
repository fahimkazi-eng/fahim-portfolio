"use client";

import { useLayoutEffect, useRef, type ElementType, type ReactNode } from "react";
import { gsap } from "gsap";
import { usePrefersReducedMotion } from "./motion-primitives";

/* ==========================================================================
   SplitText — the site's typographic signature.

   Splits a string into words → lines → per-word inner spans, then reveals
   with a masked clip translate. Runs on a wrapper that GSAP animates; the
   inner spans are static markup, so nothing re-renders during animation.

   The accessible name is preserved: the element carries a visually-hidden
   copy of the full text and the split spans are aria-hidden, so a screen
   reader reads one clean sentence rather than announcing each word
   separately. Using hidden text instead of aria-label matters — aria-label
   is prohibited on a role-less span, which is what this renders to by
   default.
   ========================================================================== */

type SplitTextProps = {
  text: string;
  as?: ElementType;
  className?: string;
  /** "lines" masks per line; "words" masks per word. */
  split?: "words" | "chars";
  delay?: number;
  stagger?: number;
  duration?: number;
  /** "up" slides from below the mask, "down" from above. */
  from?: "up" | "down";
  start?: string;
  /** Reveal immediately instead of waiting for scroll. */
  immediate?: boolean;
};

export function SplitText({
  text,
  as: Tag = "span",
  className,
  split = "words",
  delay = 0,
  stagger = 0.045,
  duration = 1.05,
  from = "up",
  start = "top 86%",
  immediate = false,
}: SplitTextProps) {
  const ref = useRef<HTMLElement | null>(null);
  const reduced = usePrefersReducedMotion();

  useLayoutEffect(() => {
    if (reduced || !ref.current) return;
    const el = ref.current;
    const units = el.querySelectorAll<HTMLElement>("[data-split-unit]");
    if (!units.length) return;

    const tween = gsap.fromTo(
      units,
      { yPercent: from === "up" ? 110 : -110 },
      {
        yPercent: 0,
        duration,
        delay,
        stagger,
        ease: "expo.out",
        ...(immediate
          ? {}
          : { scrollTrigger: { trigger: el, start, once: true } }),
        onComplete: () => {
          gsap.set(units, { clearProps: "transform" });
        },
      },
    );

    // Each unit slides out of an overflow-hidden mask. The mask is a
    // pseudo-element on the parent, so the browser only composites.
    gsap.set(units, { willChange: "transform" });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      gsap.set(units, { clearProps: "transform,willChange" });
    };
    // `text` is in the list because the split spans are rebuilt from it;
    // re-running the reveal on new text is the intended behaviour.
  }, [reduced, delay, stagger, duration, from, start, immediate, text]);

  const words = text.split(" ");

  return (
    <Tag ref={ref as never} className={className} data-split="">
      {/* The visual copy is split across spans and hidden from assistive tech,
          so the element needs its own real text for the accessible name. It
          goes in as visually-hidden content rather than aria-label: aria-label
          is only valid on an element with a role, and Tag is usually a bare
          span. Using real text also means the name is read by anything that
          reads content instead of ARIA. */}
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="block">
        {words.map((word, i) => (
          <span
            key={`${word}-${i}`}
            className="relative inline-block overflow-hidden align-bottom [clip-path:inset(-0.2em_-0.15em_-0.05em_-0.15em)]"
          >
            {split === "chars" ? (
              <span className="inline-block">
                {Array.from(word).map((char, j) => (
                  <span
                    key={j}
                    data-split-unit=""
                    className="inline-block whitespace-pre"
                  >
                    {char}
                  </span>
                ))}
              </span>
            ) : (
              <span data-split-unit="" className="inline-block whitespace-pre">
                {word}
              </span>
            )}
            {i < words.length - 1 ? <span>&nbsp;</span> : null}
          </span>
        ))}
      </span>
    </Tag>
  );
}

/**
 * Eyebrow / kicker: mono uppercase label with a rule that draws in.
 * Uses its own border-width animation, never opacity of a shared parent.
 */
export function Eyebrow({
  children,
  index,
  className = "",
}: {
  children: ReactNode;
  index?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {index ? (
        <span className="type-mono text-accent tabular-nums">{index}</span>
      ) : null}
      <span className="type-mono text-fg-muted">{children}</span>
      <span
        aria-hidden="true"
        className="h-px flex-1 origin-left bg-line-strong [animation:rule-in_1.1s_cubic-bezier(0.16,1,0.3,1)_both]"
      />
    </div>
  );
}
