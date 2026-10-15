/**
 * Copy for the Horizon scene (see components/ui/horizon-hero-section.tsx).
 *
 * Kept in its own module — with no Three.js import — so the reduced-motion
 * fallback and the route metadata can read the same strings without pulling
 * the WebGL bundle in with them.
 *
 * The lines are the source component's placeholder marketing copy. Swap them
 * here and every panel (and the static fallback) follows.
 */

export interface HorizonPanel {
  /** Panel title, split into characters for the intro reveal. */
  title: string;
  line1: string;
  line2: string;
}

export const HORIZON_PANELS: readonly HorizonPanel[] = [
  {
    title: "HORIZON",
    line1: "Where vision meets reality,",
    line2: "we shape the future of tomorrow",
  },
  {
    title: "COSMOS",
    line1: "Beyond the boundaries of imagination,",
    line2: "lies the universe of possibilities",
  },
  {
    title: "INFINITY",
    line1: "In the space between thought and creation,",
    line2: "we find the essence of true innovation",
  },
];
