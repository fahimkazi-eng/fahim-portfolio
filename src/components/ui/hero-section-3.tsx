"use client";

/* ==========================================================================
   hero-section-3 — the supplied "ScrollFlyIn" component, placed as provided.

   An aircraft crosses a full-bleed viewport in front of static typography as
   the block is scrolled through. Used by the homepage opening scene
   (components/sections/intro.tsx).

   The creative spec below is the source, unchanged. Three compatibility
   corrections were required, all outside that spec:

   1. The source read `window.innerWidth` during render, which is a
      server-render ReferenceError and a hydration mismatch. The width is
      measured in an effect instead and defaults to 0 — a state in which the
      plane is fully transparent anyway, so nothing flashes.
   2. `[-\${5*screenWidth}px, \${2.5*screenWidth}px]` and the fallback asset
      URL arrived without their backticks / quotes (the pasted source is not
      valid TypeScript). They are restored.
   3. `max-h-[68svh]` caps the plane's height so a 2000px-wide source cannot
      dwarf a phone viewport. Width stays automatic, so the aspect is kept.

   One opt-in prop is added: `progress`. The homepage intro runs a single GSAP
   scroll pipeline (MOTION.md — one rAF loop, one scroll owner). Fed an
   external 0→1 progress, the component renders its scene in place and never
   mounts a `useScroll` listener of its own. Without `progress` it behaves
   exactly as supplied, including its own 200vh sticky scroll block.
   ========================================================================== */

import * as React from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

const FALLBACK_IMAGE =
  "https://cdn.21st.dev/assets/mirror/1f/1fc1cc87bf58406056e825358749e9cd26c0b98170fd8b786dccf0b71f8192c6.svg";

export interface ScrollFlyInProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode; // For the static text content
  imageUrl: string;
  imageAlt?: string;
  /**
   * External 0→1 scroll progress. When supplied, the component renders only
   * its scene (no 200vh block, no own scroll listener) and drives the plane
   * from this value.
   */
  progress?: MotionValue<number>;
}

interface SceneProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  imageUrl: string;
  imageAlt: string;
}

/* --------------------------------------------------------------------------
   The scene itself: static type under the plane. Holds no scroll state — it
   renders whatever `progress` it is handed, whether that comes from the
   component's own scroller or from an external pipeline.
   -------------------------------------------------------------------------- */

function FlyInScene({
  progress,
  imageUrl,
  imageAlt,
  children,
  className,
}: SceneProps & { progress: MotionValue<number>; className: string }) {
  /* Compatibility fix 1: was `const screenWidth = window.innerWidth;` at
     render time. Measured after mount so SSR and hydration agree. */
  const [screenWidth, setScreenWidth] = React.useState(0);
  React.useEffect(() => {
    const measure = () => setScreenWidth(window.innerWidth);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // A more aggressive x range so the plane starts and ends fully off-screen.
  const x = useTransform(progress, [0.1, 0.8], [
    `-${5 * screenWidth}px`,
    `${2.5 * screenWidth}px`,
  ]);
  const opacity = useTransform(progress, [0.1, 0.25, 0.7, 0.8], [0, 1, 1, 0]);

  const onImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    if (event.currentTarget.src !== FALLBACK_IMAGE) {
      event.currentTarget.src = FALLBACK_IMAGE;
    }
  };

  return (
    <div
      className={cn(
        // The sticky container no longer has overflow-hidden, which prevents clipping
        "flex items-center justify-center",
        className,
      )}
    >
      {/* Static Text Content */}
      <div className="relative z-10 text-center">{children}</div>

      {/* Animated Image (Plane) */}
      <motion.div
        style={{ x, opacity }}
        className="absolute top-0 left-0 z-20 flex h-full w-full items-center"
      >
        {/* Plain <img> on purpose: the plane is transform-driven scenery with
            an off-screen travel, capped by max-height rather than a fixed box,
            and it ships one 65 KB local webp with a remote onError fallback
            the image optimizer is not configured for. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={imageAlt}
          onError={onImageError}
          className="h-auto max-h-[68svh] w-auto max-w-none"
        />
      </motion.div>
    </div>
  );
}

/* --------------------------------------------------------------------------
   Default mode (as supplied): a 200vh block whose sticky viewport owns the
   scroll measurement.
   -------------------------------------------------------------------------- */

const ScrollFlyInScroller = React.forwardRef<HTMLDivElement, SceneProps>(
  ({ children, imageUrl, imageAlt, className, ...props }, ref) => {
    const rootRef = React.useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
      target: rootRef,
      offset: ["start end", "end start"],
    });

    const setRefs = React.useCallback(
      (node: HTMLDivElement | null) => {
        rootRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref)
          (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      },
      [ref],
    );

    return (
      <div ref={setRefs} className={cn("relative h-[200vh]", className)} {...props}>
        <FlyInScene
          progress={scrollYProgress}
          imageUrl={imageUrl}
          imageAlt={imageAlt}
          className="sticky top-0 h-screen"
        >
          {children}
        </FlyInScene>
      </div>
    );
  },
);

ScrollFlyInScroller.displayName = "ScrollFlyInScroller";

/* --------------------------------------------------------------------------
   Public component. With an external `progress` it never mounts `useScroll`,
   so the page keeps a single scroll owner.
   -------------------------------------------------------------------------- */

const ScrollFlyIn = React.forwardRef<HTMLDivElement, ScrollFlyInProps>(
  (
    {
      progress,
      children,
      imageUrl,
      imageAlt = "Animated image",
      className,
      ...props
    },
    ref,
  ) => {
    if (progress) {
      return (
        <div
          ref={ref}
          className={cn("relative overflow-hidden", className)}
          {...props}
        >
          <FlyInScene
            progress={progress}
            imageUrl={imageUrl}
            imageAlt={imageAlt}
            className="absolute inset-0"
          >
            {children}
          </FlyInScene>
        </div>
      );
    }
    return (
      <ScrollFlyInScroller
        ref={ref}
        imageUrl={imageUrl}
        imageAlt={imageAlt}
        className={className}
        {...props}
      >
        {children}
      </ScrollFlyInScroller>
    );
  },
);

ScrollFlyIn.displayName = "ScrollFlyIn";

export { ScrollFlyIn };
