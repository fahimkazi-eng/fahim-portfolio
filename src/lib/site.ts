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
  roleLine: "Computer Science & Engineering student building digital products.",
  location: "Bangladesh",
  university: "Northern University Bangladesh",
  degree: "BSc in Computer Science & Engineering",
  /** Placeholder until the owner's public handles are supplied. */
  email: "kazi.fahim@example.com",
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
  index: string;
};

export const navItems: NavItem[] = [
  { id: "about", label: "About", index: "01" },
  { id: "stack", label: "Stack", index: "02" },
  { id: "work", label: "Work", index: "03" },
  { id: "story", label: "Story", index: "04" },
  { id: "path", label: "Path", index: "05" },
  { id: "build", label: "Build", index: "06" },
  { id: "contact", label: "Contact", index: "07" },
];

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

export const footerLinks: { label: string; href: string; external?: boolean }[] =
  [
    { label: "GitHub", href: "https://github.com/", external: true },
    { label: "LinkedIn", href: "https://www.linkedin.com/", external: true },
    { label: "Email", href: `mailto:${site.email}` },
  ];
