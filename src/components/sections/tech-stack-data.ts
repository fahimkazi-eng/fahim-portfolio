import type { TechMarkKey } from "@/components/ui/tech-mark";

/**
 * The stack this portfolio itself is built with. These are verifiable facts
 * about this repository, not claims about client or past work.
 *
 * `lead` marks the one technology that gets the large treatment at the top of
 * the bento. Everything else flows through `techSpanAt`, which cycles a fixed
 * asymmetric footprint so the grid keeps its rhythm no matter how many
 * entries are added — a sixth, a twelfth, a fortieth.
 */
export type TechEntry = {
  name: string;
  role: string;
  mark: TechMarkKey;
  lead?: boolean;
};

export const TECH_STACK: TechEntry[] = [
  {
    name: "Next.js 16",
    role: "App Router, Server Components, Server Actions",
    mark: "orbit",
    lead: true,
  },
  { name: "TypeScript", role: "Strict mode across the whole codebase", mark: "brace" },
  { name: "Tailwind CSS 4", role: "Design tokens, utilities, fluid type scale", mark: "utility" },
  { name: "Neon Postgres", role: "Content, projects and contact messages", mark: "cylinder" },
  { name: "Drizzle ORM", role: "Typed schema and versioned migrations", mark: "relations" },
  { name: "Zod", role: "One validation schema shared by form and action", mark: "shield" },
  { name: "GSAP", role: "Scroll-linked motion, pinning, horizontal scrub", mark: "scrub" },
  { name: "Motion", role: "Discrete UI state and microinteractions", mark: "ease" },
  { name: "Lenis", role: "Inertial scrolling on one shared rAF loop", mark: "inertia" },
  { name: "OGL", role: "Single-triangle WebGL aurora background", mark: "triangle" },
];

/**
 * Bento footprints, in order. Each run of three sums to exactly 12 columns,
 * so the desktop grid always closes a row cleanly.
 */
const SPAN_PATTERN = [
  "lg:col-span-5",
  "lg:col-span-4",
  "lg:col-span-3",
  "lg:col-span-4",
  "lg:col-span-5",
  "lg:col-span-3",
  "lg:col-span-4",
  "lg:col-span-4",
  "lg:col-span-4",
] as const;

/** Footprint for the nth non-lead technology. Safe for any count. */
export function techSpanAt(index: number): string {
  return SPAN_PATTERN[index % SPAN_PATTERN.length];
}

export function leadTech(): TechEntry | undefined {
  return TECH_STACK.find((tech) => tech.lead);
}

export function gridTech(): TechEntry[] {
  return TECH_STACK.filter((tech) => !tech.lead);
}
