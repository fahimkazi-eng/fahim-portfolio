import type { ReactNode } from "react";

/* ==========================================================================
   TechMark

   Ten original geometric marks, one per technology this site is built with.

   These are deliberately NOT brand logos. Reproducing the Next.js or Tailwind
   marks would imply an official relationship that does not exist, and a
   generic icon font would flatten the section into the same visual language
   as every other card on the page. Instead each mark is a small piece of
   drawing that describes what the tool actually does — a router circle, a
   brace pair, stacked utility bars, a database cylinder, a relations graph, a
   validation shield, a scrubbed timeline, an eased arc, an inertia curve, and
   the single triangle the WebGL background really does draw.

   All stroke-based on `currentColor`, so they inherit the accent on hover and
   the foreground at rest, and stay legible in both themes without a second
   set of assets.
   ========================================================================== */

export type TechMarkKey =
  | "orbit"
  | "brace"
  | "utility"
  | "cylinder"
  | "relations"
  | "shield"
  | "scrub"
  | "ease"
  | "inertia"
  | "triangle";

const MARKS: Record<TechMarkKey, ReactNode> = {
  /* App router: a circle with a traversed path and the node it lands on. */
  orbit: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M6 18 L18 6" />
      <circle cx="18" cy="6" r="2" fill="currentColor" stroke="none" />
    </>
  ),

  /* Strict TypeScript: a brace pair around a filled square. */
  brace: (
    <>
      <path d="M8.6 4.5C6.1 4.5 6.1 8 6.1 10c0 2-1.6 2-2.6 2 1 0 2.6 0 2.6 2 0 2 0 5.5 2.5 5.5" />
      <path d="M15.4 4.5c2.5 0 2.5 3.5 2.5 5.5 0 2 1.6 2 2.6 2-1 0-2.6 0-2.6 2 0 2 0 5.5-2.5 5.5" />
      <rect x="10.6" y="10.6" width="2.8" height="2.8" fill="currentColor" stroke="none" />
    </>
  ),

  /* Utility-first CSS: stacked bars, each one composed of the last. */
  utility: (
    <>
      <rect x="3" y="4.6" width="12.5" height="2.6" rx="1.3" />
      <rect x="8.5" y="10.7" width="12.5" height="2.6" rx="1.3" />
      <rect x="3" y="16.8" width="18" height="2.6" rx="1.3" />
    </>
  ),

  /* Managed Postgres: a cylinder, the universal database silhouette. */
  cylinder: (
    <>
      <ellipse cx="12" cy="6" rx="7.5" ry="3" />
      <path d="M4.5 6v12c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3V6" />
      <path d="M4.5 12c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3" />
    </>
  ),

  /* ORM: a relations graph. Edges first, then filled nodes over them. */
  relations: (
    <>
      <path d="M6 6 18 8M6 6l4 12M18 8 10 18" />
      <circle cx="6" cy="6" r="2.3" fill="currentColor" stroke="none" />
      <circle cx="18" cy="8" r="2.3" fill="currentColor" stroke="none" />
      <circle cx="10" cy="18" r="2.3" fill="currentColor" stroke="none" />
    </>
  ),

  /* Runtime validation: a shield with a check inside it. */
  shield: (
    <>
      <path d="M12 3 19.5 6v6c0 4.2-3.1 7.4-7.5 9-4.4-1.6-7.5-4.8-7.5-9V6Z" />
      <path d="M8.6 12.2 11 14.6l4.4-4.8" />
    </>
  ),

  /* Scroll-linked animation: a scrubbed curve with its playhead. */
  scrub: (
    <>
      <path d="M2.5 16.5C5.5 16.5 5 7.5 8.4 7.5s3.2 7 6 7 3.1-5.5 7.1-5.5" />
      <path d="M12 4.2v3.3" />
      <circle cx="12" cy="8.6" r="1.7" fill="currentColor" stroke="none" />
    </>
  ),

  /* Microinteractions: an ease-out arc and the value travelling it. */
  ease: (
    <>
      <path d="M3.5 17.5a8.5 8.5 0 0 1 17 0" />
      <path d="M7.6 17.5a4.4 4.4 0 0 1 8.8 0" />
      <circle cx="12" cy="7.6" r="1.8" fill="currentColor" stroke="none" />
    </>
  ),

  /* Inertial scrolling: the easing curve itself, end to end. */
  inertia: (
    <>
      <path d="M3 18.5C3 9.5 8.6 15.4 12 12.2S20.8 6 20.8 6" />
      <circle cx="3" cy="18.5" r="1.7" fill="currentColor" stroke="none" />
      <circle cx="20.8" cy="6" r="1.7" fill="currentColor" stroke="none" />
      <path d="M2.4 21.2h19.2" strokeDasharray="1 2.6" />
    </>
  ),

  /* WebGL background: literally one triangle inside the viewport circle. */
  triangle: (
    <>
      <circle cx="12" cy="12" r="8.8" strokeDasharray="2 3" />
      <path d="M12 7.4 16.6 16.6H7.4Z" fill="currentColor" stroke="none" />
    </>
  ),
};

export function TechMark({
  mark,
  className,
}: {
  mark: TechMarkKey;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      /* Purely decorative: the technology name is always rendered as text
         next to it, so announcing the drawing would be noise. */
      aria-hidden="true"
      focusable="false"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {MARKS[mark]}
    </svg>
  );
}
