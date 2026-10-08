/**
 * Single source of truth for identity, copy and navigation.
 *
 * Anything that is a FACT comes from the owner's brief. Anything that is not
 * yet known is either omitted or wrapped in a PLACEHOLDER helper so it is
 * visually obvious in the UI and easy to replace from the admin dashboard.
 */

export const site = {
  name: "Kazi Fahim",
  shortName: "Fahim",
  initials: "KF",
  role: "CSE Student · Software & Web Developer",
  /**
   * The job title, set directly under the name in the hero. Kept separate from
   * `role` because `role` also feeds the footer and the structured data, where
   * the fuller "CSE Student · Software & Web Developer" reads correctly. The
   * hero wants the short, confident version.
   */
  roleTitle: "Software Engineer",
  roleLine:
    "Computer Science & Engineering student building digital products end to end — schema, server, interface.",
  location: "Bangladesh",
  university: "Northern University Bangladesh",
  degree: "BSc in Computer Science & Engineering",
  email: "fahimirfan867@gmail.com",
  /**
   * Portrait. Drop the owner's photo at this exact path inside `public/` and
   * both the hero and the header pick it up — there is nothing else to wire.
   *
   * While the file is absent the `Portrait` component keeps rendering its
   * monogram layer underneath, so the frame never collapses, never shifts
   * layout, and never shows a broken image. That is why this is a path and
   * not an import: an import of a missing file would fail the build.
   */
  portrait: {
    src: "/portrait.jpg",
    alt: "Kazi Fahim",
  },
  availability: "Open to internships, freelance and collaboration",
  languages: ["Bengali", "English", "Hindi"],
  bio: [
    "I'm a Computer Science & Engineering undergraduate at Northern University Bangladesh, working across full-stack web development, data modelling and the unglamorous coordination work that makes software actually ship.",
    "My strongest work happens when a product problem needs both an interface and a backend: shaping the data model, wiring the server, then refining the interaction until it feels inevitable.",
    "Outside the editor I bring project management, public relations and team leadership — skills that come from coordinating real people around real deadlines.",
  ],
  seo: {
    title: "Kazi Fahim — CSE Student & Software Developer",
    description:
      "Portfolio of Kazi Fahim, a Computer Science & Engineering undergraduate at Northern University Bangladesh building full-stack web products with Next.js, Postgres and TypeScript.",
    keywords: [
      "Kazi Fahim",
      "CSE student Bangladesh",
      "Northern University Bangladesh",
      "full stack developer",
      "Next.js developer",
      "TypeScript",
      "PostgreSQL",
      "Drizzle ORM",
      "web developer Bangladesh",
    ],
  },
} as const;

export type Site = typeof site;

/**
 * Canonical origin for absolute URLs (sitemap, robots, Open Graph).
 *
 * Resolution order:
 *   1. NEXT_PUBLIC_SITE_URL — set this to the real domain once one is bought.
 *   2. Vercel's own build-time variables, so production is self-describing
 *      with no manual configuration.
 *   3. localhost, so a local build produces obviously-local URLs.
 *
 * It deliberately does NOT fall back to a guessed production domain. A
 * sitemap pointing at the wrong host is worse than no sitemap: it advertises
 * URLs that do not resolve.
 */
export function siteOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  if (configured) return configured;

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : null;

  if (vercel) return vercel;

  return "http://localhost:3000";
}

/** A value the owner has not supplied yet. Rendered, never hidden. */
export type Placeholder = { __placeholder: true; label?: string };
export const placeholder = (label?: string): Placeholder => ({
  __placeholder: true,
  label,
});
export const isPlaceholder = (v: unknown): v is Placeholder =>
  typeof v === "object" && v !== null && "__placeholder" in v;

export type NavItem = {
  id: string;
  label: string;
};

/**
 * Reference top bar: HOME WORK LAB BLOG ABOUT NOW USES SERVICES + CONTACT.
 *
 * Every item is a homepage section target at `#<id>`. Items whose section has
 * not landed in a phase yet are hidden by FloatingNav until the section exists
 * (existence check at mount), so the bar never advertises an anchor with no
 * destination. Sections live on the homepage; dedicated routes (case studies,
 * 404) are reached from the content itself.
 */
export const navItems: NavItem[] = [
  { id: "hero", label: "Home" },
  { id: "work", label: "Work" },
  { id: "lab", label: "Lab" },
  { id: "notes", label: "Notes" },
  { id: "about", label: "About" },
  { id: "now", label: "Now" },
  { id: "uses", label: "Uses" },
  { id: "build", label: "Services" },
];

/* --------------------------------------------------------------------------
   Hero copy. The sections below are rendered from `site` so the copy lives
   next to the code that consumes it and is trivially editable.
   -------------------------------------------------------------------------- */

/** Small identity kicker above the name, mono, uppercase. */
export const heroIdentity =
  "CSE Student · Product Builder · Software Developer";

/** The em-dash-free headline under the name. */
export const heroHeadline = "Building digital products that solve real problems.";

export const heroCtaPrimary = { label: "View Work", href: "#work" };
export const heroCtaSecondary = { label: "Let's Talk", href: "#contact" };

export type Pillar = {
  /** Key into the ICON_MAP registry in components/ui/icon.tsx */
  icon: "code" | "layers" | "users";
  title: string;
  body: string;
};

/** Copy for the About section. All factual, drawn from the brief. */
export const aboutPillars: Pillar[] = [
  {
    icon: "code",
    title: "Engineer by training",
    body: "BSc in Computer Science & Engineering, Northern University Bangladesh (2023–2027). Foundations in systems, data structures and the discipline of shipping.",
  },
  {
    icon: "layers",
    title: "Full-stack in practice",
    body: "I work across the whole surface — schema, server actions, API design, and the interface layer that makes a product feel finished.",
  },
  {
    icon: "users",
    title: "Team & coordination",
    body: "Project management, public relations, teamwork, time management, leadership and clear communication — the skills that keep a build on track.",
  },
];

export type ServiceCopy = {
  title: string;
  description: string;
  deliverables: string[];
};

export const defaultServices: ServiceCopy[] = [
  {
    title: "Full-stack web applications",
    description:
      "Complete products built end to end — from relational schema and authentication through to a polished, accessible interface.",
    deliverables: [
      "Data model & migrations",
      "Authenticated CRUD",
      "Server actions / API layer",
      "Responsive UI",
    ],
  },
  {
    title: "Interface engineering",
    description:
      "Design systems and motion work that ships as real code, not a Figma file. Accessible, keyboard-navigable and fast.",
    deliverables: [
      "Design tokens & primitives",
      "Motion & interaction design",
      "Accessibility pass",
      "Performance budget",
    ],
  },
  {
    title: "Technical project leadership",
    description:
      "Scoping, sprint planning, team coordination and handover documentation for student and early-stage product teams.",
    deliverables: [
      "Scope & milestone plan",
      "Task breakdown",
      "Progress reporting",
      "Handover docs",
    ],
  },
];

export const footerLinks: { label: string; href: string; external?: boolean }[] = [
  { label: "GitHub", href: "https://github.com/fahimkazi-eng", external: true },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/kazi-fahim-eng621", external: true },
  { label: "Email", href: `mailto:${site.email}` },
];
