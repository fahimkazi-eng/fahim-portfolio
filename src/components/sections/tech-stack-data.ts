import type { TechMarkKey } from "@/components/ui/tech-mark";
import type { BannerKey } from "@/components/sections/tech-banners";

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
  /**
   * The animated scene illustrating this technology. Optional: a technology
   * without one still renders as a card, just without the illustration, so
   * adding an entry to the database can never break the section.
   */
  banner?: BannerKey;
  /**
   * This technology's hue, 0-360. It is the ONLY thing that varies per card —
   * saturation and lightness are global (see `--tech-s` / `--tech-l`), which is
   * what keeps ten hues reading as one palette instead of a rainbow.
   *
   * Hues were chosen to be distinguishable from each other, not to imitate any
   * vendor's brand colour.
   */
  hue: number;
  lead?: boolean;
};

export const TECH_STACK: TechEntry[] = [
  {
    name: "Next.js 16",
    role: "App Router, Server Components, Server Actions",
    mark: "orbit",
    banner: "router",
    hue: 18,
    lead: true,
  },
  {
    name: "TypeScript",
    role: "Strict mode across the whole codebase",
    mark: "brace",
    banner: "types",
    hue: 212,
  },
  {
    name: "Tailwind CSS 4",
    role: "Design tokens, utilities, fluid type scale",
    mark: "utility",
    banner: "utilities",
    hue: 158,
  },
  {
    name: "Neon Postgres",
    role: "Content, projects and contact messages",
    mark: "cylinder",
    banner: "database",
    hue: 268,
  },
  {
    name: "Drizzle ORM",
    role: "Typed schema and versioned migrations",
    mark: "relations",
    banner: "schema",
    hue: 190,
  },
  {
    name: "Zod",
    role: "One validation schema shared by form and action",
    mark: "shield",
    banner: "validation",
    hue: 330,
  },
  {
    name: "GSAP",
    role: "Scroll-linked motion, pinning, horizontal scrub",
    mark: "scrub",
    banner: "timeline",
    hue: 340,
  },
  {
    name: "Motion",
    role: "Discrete UI state and microinteractions",
    mark: "ease",
    banner: "spring",
    hue: 262,
  },
  {
    name: "Lenis",
    role: "Inertial scrolling on one shared rAF loop",
    mark: "inertia",
    banner: "inertia",
    hue: 96,
  },
  {
    name: "OGL",
    role: "Single-triangle WebGL aurora background",
    mark: "triangle",
    banner: "shader",
    hue: 178,
  },
];

/**
 * Bento footprints, in order. Each run of three sums to exactly 12 columns,
 * so the desktop grid always closes a row cleanly.
 *
 * Each entry is a pair of complete class strings: the footprint in the 6-column
 * tablet grid and in the 12-column desktop grid. Both are needed because the
 * section uses two grids, and a span stated only for `lg` leaves every cell at
 * one column between `md` and `lg`, which collapses nine cards into a single
 * unreadable 124px column.
 *
 * These must be written out in full rather than interpolated (e.g.
 * `md:col-span-${n}`). Tailwind extracts candidates by scanning source text for
 * whole class names, so an interpolated one is never generated and the rule
 * silently does not exist — the cell just falls back to `grid-column: auto`.
 * Writing the literals keeps them discoverable; the comment below is the
 * reminder.
 */
const SPAN_PATTERN = [
  "md:col-span-3 lg:col-span-5",
  "md:col-span-2 lg:col-span-4",
  "md:col-span-2 lg:col-span-3",
  "md:col-span-2 lg:col-span-4",
  "md:col-span-3 lg:col-span-5",
  "md:col-span-2 lg:col-span-3",
  "md:col-span-2 lg:col-span-4",
  "md:col-span-2 lg:col-span-4",
  "md:col-span-2 lg:col-span-4",
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
