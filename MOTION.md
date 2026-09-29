# Motion system

This document is the contract for how animation works on this site. The
guiding rule is that **three libraries never animate the same thing.** Most
motion bugs in a site like this come from two systems writing to the same CSS
property on the same frame, so the boundaries are drawn explicitly and kept.

## The three owners

| Owner      | Owns                                                     | Where                        |
| ---------- | -------------------------------------------------------- | ---------------------------- |
| **Lenis**  | The scroll position itself (smooth scrolling)             | `MotionProvider`             |
| **GSAP**   | Values *linked to* scroll — parallax, pinning, scrubbing  | `scroll-motion.tsx`, sections |
| **Motion** | Discrete UI state — enter, hover, tap, presence           | `motion-primitives.tsx`      |

If a property is scroll-linked, GSAP owns it. If it is a one-shot response to
an event, Motion owns it. Nothing else touches it.

## Rules

1. **One rAF loop.** Lenis is driven from `gsap.ticker`, not its own
   `requestAnimationFrame` (`MotionProvider`). Two loops would let scroll
   position and ScrollTrigger's idea of scroll position drift apart.
2. **No `transition-all`** on anything GSAP or Motion animates. A Tailwind
   `transition-*` on a GSAP-driven property fights the tween and produces
   lag. Transitions are only used on properties no library animates
   (border-color, background-color, color).
3. **Transform and opacity only** for anything high-frequency. Both are
   compositor properties, so they never trigger layout.
4. **No React state for per-frame values.** Scroll position, pointer position
   and drag progress live in refs and are written straight to
   `element.style`. React state would re-render the tree on every frame.
5. **Preview states are in CSS, not JS.** `Reveal` and `SplitText` start from
   a visible default and *add* the "from" state at runtime, so the content is
   legible with JavaScript disabled.

## Reduced motion

`prefers-reduced-motion: reduce` is handled in two places, and both are
required:

- **CSS** (`globals.css`) collapses every animation/transition duration, pins
  `[data-reveal]` / `[data-split]` to their final state, and hides
  `[data-preloader]`.
- **JS** (`usePrefersReducedMotion`) skips creating Lenis, skips every
  ScrollTrigger, and skips the WebGL field entirely.

The CSS half matters because it applies before hydration — a reduced-motion
visitor never sees a frame of the intro even if the bundle is slow.

`usePrefersReducedMotion` reads through `useSyncExternalStore` with a server
snapshot of `false`, so the server and client agree on the first render.

## Media query is an external system

Theme preference and reduced-motion preference both live outside React
(localStorage and a media query). Both are read via `useSyncExternalStore`
rather than `useState` + `useEffect`, which avoids a cascading render on
mount and keeps hydration consistent.

## Idle behaviour

The magnetic and tilt effects park their `requestAnimationFrame` loop once
the pointer interaction settles (`raf = 0`), instead of running rAF forever.
`AuroraField` pauses the WebGL loop when the tab is hidden or after a period
of inactivity.
