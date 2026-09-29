/**
 * The stack this portfolio itself is built with. These are verifiable facts
 * about the repository, not claims about client or past work.
 */
export const TECH_STACK: { name: string; role: string }[] = [
  { name: "Next.js 16", role: "App Router, Server Components, Server Actions" },
  { name: "TypeScript", role: "Strict mode across the whole codebase" },
  { name: "Tailwind CSS 4", role: "Design tokens, utilities, fluid type scale" },
  { name: "Neon Postgres", role: "Content, projects and contact messages" },
  { name: "Drizzle ORM", role: "Typed schema and versioned migrations" },
  { name: "Zod", role: "One validation schema shared by form and action" },
  { name: "GSAP", role: "Scroll-linked motion, pinning, horizontal scrub" },
  { name: "Motion", role: "Discrete UI state and microinteractions" },
  { name: "Lenis", role: "Inertial scrolling, one shared rAF loop" },
  { name: "OGL", role: "Single-triangle WebGL aurora background" },
];
