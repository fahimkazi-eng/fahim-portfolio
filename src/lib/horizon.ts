/**
 * Copy for the Horizon scene (see components/ui/horizon-hero-section.tsx).
 *
 * Kept in its own module — with no Three.js import — so the reduced-motion
 * fallback and the route metadata can read the same strings without pulling
 * the WebGL bundle in with them.
 *
 * The three panels read as one arc: who you are → what you build → how to
 * work with you. Facts here are drawn from lib/site.ts so nothing is claimed
 * that the rest of the site does not already say.
 */

export interface HorizonPanel {
  /** Panel title, split into characters for the intro reveal. */
  title: string;
  line1: string;
  line2: string;
}

export const HORIZON_PANELS: readonly HorizonPanel[] = [
  {
    title: "KAZI FAHIM",
    line1: "Software engineer and CSE student,",
    line2: "building digital products that solve real problems",
  },
  {
    title: "MY WORK",
    line1: "UniMate, FixBondhu and Lumina Digital.",
    line2: "Built end to end — schema, server, interface",
  },
  {
    title: "LET'S BUILD",
    line1: "Open to internships, freelance and collaboration.",
    line2: "Based in Dhaka, Bangladesh",
  },
];

/**
 * Copy for the homepage opening scene (components/sections/intro.tsx).
 *
 * The scene's cosmos and first panel come from HORIZON_PANELS above; this is
 * the call that resolves it — the aircraft crosses "KAZI FAHIM" / "DIVE INTO
 * MY WORLD" and the visitor is invited to scroll into the portfolio itself.
 */
export const INTRO_COPY = {
  eyebrow: "KAZI FAHIM",
  heading: "DIVE INTO MY WORLD",
  supporting: "Ideas. Code. Experiences.",
  prompt: "SCROLL TO EXPLORE",
} as const;
