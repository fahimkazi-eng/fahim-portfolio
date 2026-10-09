"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
  type ElementType,
  type ReactNode,
} from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/* ==========================================================================
   MOTION SYSTEM
   Three owners, no overlaps. See MOTION.md.

   1. Lenis ......... owns the scroll position itself.
   2. GSAP          owns scroll-LINKED values (parallax, pinning, scrubbing).
   3. Motion        owns discrete, non-scroll UI state (hover, tap, enter).

   Rules enforced here:
   - Lenis + ScrollTrigger share one rAF loop via gsap.ticker.
   - Anything GSAP animates is never also animated by Motion, and never
     carries a Tailwind `transition-*` on the same property.
   - prefers-reduced-motion disables Lenis smoothing, and every
     ScrollTrigger is skipped so the DOM is left in its final state.
   ========================================================================== */

/* ==========================================================================
   MOTION PREFERENCE — the single source of truth for "does the visitor see
   motion?"

   Mirrors the theme provider's shape. A `kf-motion` localStorage value of
   `auto` | `on` | `off` is resolved by `motionInitScript` before first
   paint into <html data-motion="on|off">. Every gate on the site reads that
   one attribute:

   - the reduced-motion block in globals.css (`html[data-motion="off"]`),
   - every `motion-off:` Tailwind utility (see the custom variant there),
   - and the JS gates here (Lenis, ScrollTrigger, canvases, cursor).

   An explicit `on` therefore overrides the OS preference, and `off`
   disables motion even when the OS allows it. `auto` follows the system,
   live — if the OS setting flips while the page is open, the media
   listener re-resolves the attribute.
   ========================================================================== */

export type MotionPreference = "auto" | "on" | "off";

const MOTION_KEY = "kf-motion";

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

function isMotionPreference(value: unknown): value is MotionPreference {
  return value === "auto" || value === "on" || value === "off";
}

function readMotionPreference(): MotionPreference {
  try {
    const stored = localStorage.getItem(MOTION_KEY);
    return isMotionPreference(stored) ? stored : "auto";
  } catch {
    // Private mode, or storage blocked. Follow the system.
    return "auto";
  }
}

function systemReduced(): boolean {
  return window.matchMedia(REDUCED_QUERY).matches;
}

/** Does this preference resolve to "motion off"? */
function resolveReduced(pref: MotionPreference): boolean {
  if (pref === "on") return false;
  if (pref === "off") return true;
  return systemReduced();
}

/** Writes the resolved state to <html>. The only DOM side effect. */
function applyMotionToRoot(reduced: boolean) {
  document.documentElement.dataset.motion = reduced ? "off" : "on";
}

/**
 * Runs before hydration, ahead of any stylesheet application, so the
 * reduced-motion rules land on the correct frame. Kept as a string in the
 * document head, exactly like the theme init script.
 */
export const motionInitScript = `
(function () {
  try {
    var stored = localStorage.getItem('${MOTION_KEY}');
    var pref = stored === 'on' || stored === 'off' || stored === 'auto' ? stored : 'auto';
    var reduced = pref === 'off' || (pref === 'auto' && window.matchMedia('${REDUCED_QUERY}').matches);
    document.documentElement.dataset.motion = reduced ? 'off' : 'on';
  } catch (e) {}
})();
`;

/**
 * Store shape: `{ preference, reduced }` as one object so a single snapshot
 * serves both subscribers and they can never disagree with each other for a
 * frame. `reduced: true` means "motion is OFF".
 */
type MotionSnapshot = { preference: MotionPreference; reduced: boolean };

/** Server render: assume motion is allowed, which is the common case. */
const SERVER_MOTION_SNAPSHOT: MotionSnapshot = { preference: "auto", reduced: false };

let motionCached: MotionSnapshot | null = null;
const motionListeners = new Set<() => void>();

function emitMotion() {
  motionCached = null;
  for (const listener of motionListeners) listener();
}

function getMotionSnapshot(): MotionSnapshot {
  if (!motionCached) {
    const preference = readMotionPreference();
    motionCached = { preference, reduced: resolveReduced(preference) };
  }
  return motionCached;
}

function subscribeMotion(listener: () => void): () => void {
  motionListeners.add(listener);

  // Only wire the media listener once, however many components subscribe.
  if (motionListeners.size === 1) {
    const media = window.matchMedia(REDUCED_QUERY);
    media.addEventListener("change", onMotionExternalChange);
    window.addEventListener("storage", onMotionExternalChange);
  }

  return () => {
    motionListeners.delete(listener);
    if (motionListeners.size === 0) {
      const media = window.matchMedia(REDUCED_QUERY);
      media.removeEventListener("change", onMotionExternalChange);
      window.removeEventListener("storage", onMotionExternalChange);
    }
  };
}

/**
 * Fires when the OS motion setting flips (auto mode) or another tab writes
 * the preference.
 */
function onMotionExternalChange() {
  const preference = readMotionPreference();
  applyMotionToRoot(resolveReduced(preference));
  emitMotion();
}

/** Persist + apply a preference. Emits so every subscriber re-renders. */
export function setMotionPreference(value: MotionPreference) {
  try {
    localStorage.setItem(MOTION_KEY, value);
  } catch {
    // Private mode: still applies for this session.
  }
  applyMotionToRoot(resolveReduced(value));
  emitMotion();
}

/**
 * True when the visitor should not see motion. Reads the resolved state
 * (preference + OS), not the raw media query, so a forced "on" wins.
 */
export function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeMotion,
    () => getMotionSnapshot().reduced,
    () => false,
  );
}

/** Full preference + resolved state, for controls (nav toggle, palette). */
export function useMotionPreference() {
  return useSyncExternalStore(
    subscribeMotion,
    getMotionSnapshot,
    () => SERVER_MOTION_SNAPSHOT,
  );
}

/** Sync read for one-off handlers (scroll behavior, cursor init). */
export function motionReduced(): boolean {
  const attr = document.documentElement.dataset.motion;
  if (attr) return attr === "off";
  return systemReduced();
}

/**
 * Root provider. Installs GSAP plugins, starts Lenis and wires the two to a
 * single rAF loop.
 *
 * It deliberately publishes no "ready" state. Entrance animations use
 * ScrollTrigger, which measures the document itself and fires when the
 * element actually reaches its start position — a provider flag would only
 * add a render pass that every child then has to wait on.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  const reduced = usePrefersReducedMotion();

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
  }, []);

  useEffect(() => {
    if (reduced) {
      // No smoothing, no scroll-linked work. Content renders in final state,
      // but triggers still need a measure pass so any that did mount have
      // correct start/end values.
      ScrollTrigger.refresh();
      return;
    }

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      // Native touch scrolling stays native — inertia libraries fight
      // momentum scrolling on mobile and it feels broken.
      syncTouch: false,
      touchMultiplier: 1.4,
    });

    // One loop for both libraries.
    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Anchor navigation routes through Lenis so in-page links get the
    // same eased movement as the wheel.
    const onAnchorClick = (event: MouseEvent) => {
      const target = (event.target as HTMLElement | null)?.closest<HTMLAnchorElement>(
        'a[href^="#"]',
      );
      if (!target) return;
      const hash = target.getAttribute("href");
      if (!hash || hash === "#") return;

      const element = document.querySelector(hash);
      if (!element) return;

      event.preventDefault();
      lenis.scrollTo(element as HTMLElement, { offset: -96, duration: 1.3 });
    };

    document.addEventListener("click", onAnchorClick);

    // Layout settles after fonts and media; refresh so pinned sections
    // measure the real document rather than a pre-font one.
    const refresh = () => ScrollTrigger.refresh();
    void document.fonts?.ready.then(refresh);
    window.addEventListener("load", refresh);

    return () => {
      document.removeEventListener("click", onAnchorClick);
      window.removeEventListener("load", refresh);
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, [reduced]);

  return <>{children}</>;
}

/** Jump to the top without fighting the browser's native restore. */
export function ScrollToTop({ enabled = true }: { enabled?: boolean }) {
  useEffect(() => {
    if (!enabled) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [enabled]);
  return null;
}

/* ==========================================================================
   Reveal — the single scroll entrance used across the whole site.
   GSAP-driven, scrub-free, one trigger per element. Content is visible by
   default in CSS; this only adds the "from" state at runtime.
   ========================================================================== */

type RevealProps = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /** Seconds of delay before this element starts. */
  delay?: number;
  /** Travel distance in px. */
  y?: number;
  classNameReveal?: string;
};

export function Reveal({
  children,
  as: Tag = "div",
  className,
  delay = 0,
  y = 28,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const reduced = usePrefersReducedMotion();

  useLayoutEffect(() => {
    if (reduced || !ref.current) return;
    const el = ref.current;

    const tween = gsap.fromTo(
      el,
      { autoAlpha: 0, y },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.9,
        delay,
        ease: "expo.out",
        scrollTrigger: {
          trigger: el,
          start: "top 88%",
          once: true,
        },
        onComplete: () => {
          // Hand the element back to the compositor with no lingering
          // inline styles.
          gsap.set(el, { clearProps: "transform,opacity,visibility" });
        },
      },
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      gsap.set(el, { clearProps: "transform,opacity,visibility" });
    };
  }, [reduced, delay, y]);

  return (
    <Tag ref={ref as never} className={className} data-reveal="">
      {children}
    </Tag>
  );
}

/* ==========================================================================
   Stagger — wraps children and reveals them in sequence.
   Owns transform/opacity of its own direct children only.
   ========================================================================== */

type StaggerProps = {
  children: ReactNode;
  className?: string;
  /** Seconds between each child. */
  step?: number;
  as?: ElementType;
};

export function Stagger({
  children,
  className,
  step = 0.075,
  as: Tag = "div",
}: StaggerProps) {
  const ref = useRef<HTMLElement | null>(null);
  const reduced = usePrefersReducedMotion();

  useLayoutEffect(() => {
    if (reduced || !ref.current) return;
    const el = ref.current;
    const items = Array.from(el.children) as HTMLElement[];
    if (!items.length) return;

    const tween = gsap.fromTo(
      items,
      { autoAlpha: 0, y: 22 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.8,
        stagger: step,
        ease: "expo.out",
        scrollTrigger: { trigger: el, start: "top 85%", once: true },
        onComplete: () => {
          gsap.set(items, { clearProps: "transform,opacity,visibility" });
        },
      },
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      gsap.set(items, { clearProps: "transform,opacity,visibility" });
    };
  }, [reduced, step]);

  return (
    <Tag ref={ref as never} className={className} data-stagger="">
      {children}
    </Tag>
  );
}

/* ==========================================================================
   Reduced-motion escape hatch
   ========================================================================== */

export function useReducedMotionSafe() {
  return usePrefersReducedMotion();
}
