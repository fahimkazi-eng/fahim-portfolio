"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { usePrefersReducedMotion } from "@/components/animations/motion-primitives";
import { cn } from "@/lib/utils";
import { ProjectSignature } from "./project-signature";

/* ==========================================================================
   ProjectFrame

   The media surface for a project. Three states, in priority order:
     1. a real image, scaled subtly on hover
     2. a deterministic, project-specific abstract signature (art-directed,
        never a product mock)
     3. nothing — but state 2 almost always renders

   Screenshots are presented by FIT, not by crop. A phone screenshot is
   portrait (these two are 738x1600 and 825x1600) and the frame is landscape,
   so `object-cover` would discard roughly five sixths of the image and leave
   a letterbox band containing maybe a toolbar. That is not a preview of
   anything. So the sharp layer is `object-contain` and the leftover space is
   filled by a heavily scaled, blurred copy of the same image — the standard
   device-showcase treatment. Every pixel of the real interface stays visible,
   the frame keeps its designed proportions, and if a future screenshot IS
   landscape the backdrop simply hides behind it.

   The hover zoom animates `scale` on the media wrapper only. The frame itself
   stays still, so this never competes with the tilt/spotlight transforms
   applied to ancestors.
   ========================================================================== */

type ProjectFrameProps = {
  src: string | null | undefined;
  title: string;
  slug?: string;
  className?: string;
  /** Aspect is handled by the caller's height/width classes. */
  priority?: boolean;
};

export function ProjectFrame({
  src,
  title,
  slug,
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

    const quickTo = gsap.quickTo(el, "xPercent", {
      duration: 0.6,
      ease: "power3.out",
    });
    const quickToY = gsap.quickTo(el, "yPercent", {
      duration: 0.6,
      ease: "power3.out",
    });

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
  const seed = slug || title;

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
          <div
            ref={mediaRef}
            className="absolute -inset-[4%] will-change-transform"
          >
            {/* Backdrop — fills the frame, heavily blurred, so a portrait
                screenshot sits on colour derived from itself instead of on a
                dead grey field. Small and low quality on purpose: it carries
                no detail, only tone. */}
            <Image
              src={src as string}
              alt=""
              aria-hidden="true"
              fill
              sizes="320px"
              quality={30}
              preload={priority}
              loading={priority ? undefined : "lazy"}
              className="scale-125 object-cover opacity-45 blur-2xl saturate-[1.4]"
            />
            {/* Foreground — the actual interface, fitted whole. */}
            <Image
              src={src as string}
              alt={`${title} — interface screenshot`}
              fill
              sizes="(max-width: 1024px) 100vw, 58vw"
              quality={80}
              preload={priority}
              loading={priority ? undefined : "lazy"}
              onError={() => setFailed(true)}
              className="object-contain [transition:transform_900ms_cubic-bezier(0.16,1,0.3,1)] group-hover/frame:scale-[1.035]"
            />
          </div>
          {/* Scrim so the label stays legible over any screenshot. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/45 via-transparent to-transparent opacity-70"
          />
        </>
      ) : (
        /* Abstract, deterministic signature: never a fake product UI. */
        <ProjectSignature seed={seed} title={title} className="absolute inset-0" />
      )}
    </div>
  );
}
