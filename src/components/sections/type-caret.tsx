"use client";

/**
 * Terminal caret. Pure CSS — the blink is a keyframe, so it costs no
 * JavaScript and stops under reduced motion.
 */
export function TypeCaret({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`mb-[0.12em] inline-block h-[0.72em] w-[0.07em] shrink-0 bg-accent [animation:caret-blink_1.05s_steps(1)_infinite] motion-reduce:animate-none ${className}`}
    />
  );
}
