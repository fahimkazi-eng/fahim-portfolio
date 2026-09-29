"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { usePrefersReducedMotion } from "@/components/animations/motion-primitives";
import { cn } from "@/lib/utils";

/* ==========================================================================
   ProjectFrame

   The media surface for a project. Three states, in priority order:
     1. a real image, scaled subtly on hover
     2. a generated abstract placeholder (clearly labelled "pending")
     3. nothing

   The hover zoom animates `scale` on the <img> only. The frame itself stays
   still, so this never competes with the tilt/spotlight transforms applied
   to ancestors.
   ========================================================================== */

type ProjectFrameProps = {
  src: string | null | undefined;
  title: string;
  className?: string;
  /** Aspect is handled by the caller's height/width classes. */
  priority?: boolean;
};

export function ProjectFrame({
  src,
  title,
  className,
  priority = false,
}: ProjectFrameProps) {
  const mediaRef = useRef<HTMLDivElement | null>(null);
  const [failed, setFailed] = useState(false);
  const reduced = usePrefersReducedMotion();

  /* Subtle counter-parallax: the media drifts against the pointer. */
  useLayoutEffect(() => {
    const el = mediaRef.current;
    if (!el || reduced) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const quickTo = gsap.quickTo(el, "xPercent", { duration: 0.6, ease: "power3.out" });
    const quickToY = gsap.quickTo(el, "yPercent", { duration: 0.6, ease: "power3.out" });

    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      quickTo(((event.clientX - rect.left) / rect.width - 0.5) * -3);
      quickToY(((event.clientY - rect.top) / rect.height - 0.5) * -3);
    };
    const onLeave = () => {
      quickTo(0);
      quickToY(0);
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      gsap.set(el, { clearProps: "transform" });
    };
  }, [reduced]);

  const showImage = Boolean(src) && !failed;

  return (
    <div
      className={cn(
        "group/frame relative isolate overflow-hidden border-b border-line lg:border-b-0 lg:border-r",
        "bg-[linear-gradient(140deg,color-mix(in_oklab,var(--accent)_14%,transparent),transparent_58%)]",
        className,
      )}
    >
      {showImage ? (
        <>
          <div ref={mediaRef} className="absolute -inset-[4%] will-change-transform">
            <Image
              src={src as string}
              alt={`${title} — interface screenshot`}
              fill
              sizes="(max-width: 1024px) 100vw, 58vw"
              quality={80}
              preload={priority}
              loading={priority ? undefined : "lazy"}
              onError={() => setFailed(true)}
              className="object-cover [transition:transform_900ms_cubic-bezier(0.16,1,0.3,1)] group-hover/frame:scale-[1.035]"
            />
          </div>
          {/* Scrim so the label stays legible over any screenshot. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/45 via-transparent to-transparent opacity-70"
          />
        </>
      ) : (
        /* Honest placeholder: an abstract field, not a fake screenshot. */
        <div className="absolute inset-0 grid place-items-center p-6">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.5] [background-image:linear-gradient(to_right,var(--grid-line)_1px,transparent_1px),linear-gradient(to_bottom,var(--grid-line)_1px,transparent_1px)] [background-size:38px_38px]"
          />
          <div className="relative max-w-[22rem] text-center">
            <span
              aria-hidden="true"
              className="mx-auto mb-4 block h-px w-12 bg-accent/60"
            />
            <p className="type-mono text-accent">Screenshot pending</p>
            <p className="mt-2 text-[0.78rem] leading-relaxed text-fg-muted">
              No image has been supplied for {title}. Add one in the admin
              dashboard — until then this placeholder stands in rather than
              implying work that has not been shown.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
