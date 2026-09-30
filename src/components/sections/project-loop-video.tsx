"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePrefersReducedMotion } from "@/components/animations/motion-primitives";
import { cn } from "@/lib/utils";
import { ProjectSignature } from "./project-signature";

/* ==========================================================================
   ProjectLoopVideo — a silent, self-playing demo recording for Selected Work.

   WHY A SEPARATE COMPONENT FROM `ProjectVideo`
   The case-study player is built for inspection: scrub, step, unmute,
   fullscreen. This one is built for ambience — it plays itself, loops, and
   offers nothing to press. Reusing the player would have dragged a control
   bar and a keyboard-shortcut layer into a section that is meant to be read,
   not operated. Same media decisions, different intent, so two components.

   SILENT BY CONSTRUCTION
   `muted` and `playsInline` are set as attributes AND `el.muted` is set as a
   property before every `play()`. Browsers gate autoplay on the *property* at
   the moment play is requested, so the attribute alone is not a guarantee.
   There is deliberately no unmute affordance: a recording that starts making
   noise by itself is hostile, and these clips are UI walkthroughs where the
   audio track carries nothing.

   NOTHING IS FETCHED UNTIL IT IS NEARLY VISIBLE
   `src` is absent from the element until it is within 150% of the viewport.
   Selected Work is a pinned horizontal track, so its panels are all "in" the
   document at once; without this gate the page would pull every recording on
   load. Once armed the observer disconnects — a video is never un-armed.

   POSTER DOUBLES AS THE STILL'S BACKSTOP
   `poster` prefers the dedicated poster frame and falls back to the project's
   existing screenshot, so a future project with a video but no poster still
   has a real image in the box rather than an empty gradient.

   REDUCED MOTION GETS A STILL FRAME
   Under `prefers-reduced-motion: reduce` the source is never attached, so no
   video bytes are fetched and nothing moves. The poster — a genuine frame from
   the genuine recording — stays on screen. This is also the mitigation for
   WCAG 2.2 SC 2.2.2: a looping clip that auto-starts and runs in parallel
   with other content normally needs a pause control, and this design has none
   by request. Honouring reduce is the substitute offered in its place.

   FALLBACK CHAIN
   video -> the project's still -> the abstract signature. A missing or broken
   recording degrades to exactly what the section showed before, so nothing
   about this is a placeholder pretending to be a product.

   MOTION OWNERSHIP
   No GSAP and no Motion here. The panel's entrance and the pinned track are
   owned by `work.tsx`; everything in this file is either a discrete UI state
   or a CSS transition on an element no library touches, per MOTION.md.
   ========================================================================== */

type ProjectLoopVideoProps = {
  /** Path or full URL to the recording. Null/empty renders the still instead. */
  src: string | null | undefined;
  /** Poster frame. Falls back to `stillSrc` when absent. */
  poster?: string | null;
  /** The project's existing screenshot, used as poster and as fallback. */
  stillSrc?: string | null;
  title: string;
  slug?: string;
  className?: string;
};

export function ProjectLoopVideo({
  src,
  poster,
  stillSrc,
  title,
  slug,
  className,
}: ProjectLoopVideoProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  /** Has the source been attached? Gates every byte of video. */
  const [armed, setArmed] = useState(false);
  /** Is the box actually on screen? Gates playback, not loading. */
  const [visible, setVisible] = useState(false);
  /** Frames are decoding, so the video may cross-fade over the poster. */
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  const reduced = usePrefersReducedMotion();

  /* --- 1. arm: attach the source only once we are close to the viewport --- */
  useEffect(() => {
    const el = wrapRef.current;
    // Reduced motion never arms, so it never downloads the clip.
    if (!el || reduced) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setArmed(true);
        observer.disconnect();
      },
      { rootMargin: "150% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [reduced]);

  /* --- 2. visibility: only play while the panel is genuinely on screen ---- */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || reduced) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) setVisible(entry.isIntersecting);
      },
      // A sliver of the panel peeking past the fold is not "being watched".
      { threshold: 0.15 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [reduced]);

  /* --- 3. playback: play when visible, pause when not, resume in place --- */
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !armed || failed || reduced) return;

    if (!visible) {
      el.pause();
      return;
    }

    // Property, not just the attribute: see the note in the header.
    el.muted = true;

    const attempt = el.play();
    if (attempt) {
      attempt.catch(() => {
        /* Autoplay refused (data saver, low power, strict policy). The poster
           stays put and nothing is broken — an ambient loop that declines to
           start is not an error worth showing anyone. */
      });
    }
  }, [armed, visible, failed, reduced]);

  const showVideo = Boolean(src) && !failed;
  const frame = poster || stillSrc || null;
  const showStill = !showVideo && Boolean(stillSrc);
  const showSignature = !showVideo && !showStill;

  /* The label must describe what is actually on screen. An earlier version
     said "silent looping demo recording" unconditionally, which told screen
     reader users a project had a recording when it was showing an abstract
     mark instead. Same rule as the "Live" link: never describe a capability
     the project does not have. */
  const mediaLabel = showVideo
    ? `${title} — silent looping demo recording`
    : showStill
      ? `${title} — interface screenshot`
      : `${title} — abstract mark`;

  return (
    <div
      ref={wrapRef}
      role="img"
      aria-label={mediaLabel}
      className={cn(
        "group/lv relative isolate overflow-hidden border-b border-line lg:border-b-0 lg:border-r",
        className,
      )}
    >
      {/* Backdrop. Fills the letterbox of any future aspect ratio with site
          colour, and is what a visitor sees before the poster decodes. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(140deg,color-mix(in_oklab,var(--accent)_15%,transparent),transparent_58%)]"
      />

      {/* Oversized so the hover scale never exposes an edge inside the
          overflow-hidden, rounded frame. */}
      <div className="absolute -inset-[3%] will-change-transform [transition:transform_900ms_cubic-bezier(0.16,1,0.3,1)] group-hover/lv:scale-[1.035] motion-reduce:transition-none motion-reduce:group-hover/lv:scale-100">
        {showVideo ? (
          <video
            ref={videoRef}
            src={armed ? (src as string) : undefined}
            poster={frame ?? undefined}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            onPlaying={() => setReady(true)}
            onError={() => setFailed(true)}
            className={cn(
              "absolute inset-0 size-full object-contain",
              "[transition:opacity_700ms_ease-out] motion-reduce:transition-none",
              ready ? "opacity-100" : "opacity-0",
            )}
          />
        ) : showStill ? (
          <Image
            src={stillSrc as string}
            alt={`${title} — interface screenshot`}
            fill
            sizes="(max-width: 1024px) 100vw, 58vw"
            quality={80}
            className="object-contain"
          />
        ) : showSignature ? (
          /* Abstract, deterministic. Never a fake product mock. */
          <ProjectSignature seed={slug || title} title={title} className="absolute inset-0" />
        ) : null}
      </div>

      {/* Vignette, so the hairline and the panel's own border read as one
          object rather than a rectangle pasted onto the page. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/45 via-transparent to-transparent opacity-70"
      />

      {/* Hover focus ring — border-color only, so it never fights a transform. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-card ring-1 ring-inset ring-white/10 [transition:box-shadow_500ms_ease-out] group-hover/lv:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--accent)_70%,transparent)] motion-reduce:transition-none"
      />
    </div>
  );
}