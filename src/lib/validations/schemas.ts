import { z } from "zod";

/* --------------------------------------------------------------------------
   Shared primitives
   -------------------------------------------------------------------------- */

const trimmed = z.string().trim();

const requiredText = (min: number, max: number, label: string) =>
  trimmed.min(min, `${label} is required`).max(max, `${label} is too long`);

const optionalUrl = z
  .union([z.literal(""), trimmed])
  .optional()
  .transform((v) => (v ? v : null))
  .refine(
    (v) => v === null || /^https?:\/\/.+\..+/.test(v),
    "Must be a full URL starting with http:// or https://",
  );

/**
 * An asset may be either a site-relative path served from `public/` OR a full
 * http(s) URL. Admin media fields store both kinds (e.g. `/projects/foo.jpg`
 * or `https://cdn.example/foo.jpg`), so they must not be validated as plain
 * URLs — doing so would reject every path-based asset the site actually uses.
 */
const assetRef = z
  .union([z.literal(""), trimmed])
  .optional()
  .transform((v) => (v ? v : null))
  .refine(
    (v) => v === null || /^https?:\/\/.+\..+/.test(v) || /^\/[\w\-./]+\.[a-z0-9]{2,5}$/i.test(v),
    "Use a path like /projects/cover.jpg or a full https:// URL",
  );

const boolField = z
  .union([z.boolean(), z.literal("on"), z.literal("true"), z.literal("false")])
  .optional()
  .transform((v) => v === true || v === "on" || v === "true");

/** text[] columns are edited as a textarea, one item per line. */
const lineList = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((value) => {
    if (value === undefined) return [] as string[];
    const items = Array.isArray(value) ? value : value.split(/\r?\n/);
    return items.map((v) => v.trim()).filter(Boolean);
  });

/* --------------------------------------------------------------------------
   Field schemas — shared by the Server Action AND the client form so the
   error messages can never drift.
   -------------------------------------------------------------------------- */

export const contactFieldSchema = z.object({
  name: requiredText(2, 120, "Name"),
  email: trimmed
    .min(1, "Email is required")
    .email("Enter a valid email address")
    .max(255, "Email is too long"),
  subject: trimmed.max(200, "Subject is too long").optional().default(""),
  message: requiredText(10, 4000, "Message"),
  projectType: trimmed.max(120, "Too long").optional().default(""),
  stage: trimmed.max(120, "Too long").optional().default(""),
  budget: trimmed.max(120, "Too long").optional().default(""),
  /** Honeypot. Must stay empty. */
  website: z.literal("").optional().default(""),
});

export type ContactInput = z.infer<typeof contactFieldSchema>;

export const projectFieldSchema = z.object({
  title: requiredText(2, 160, "Title"),
  slug: trimmed
    .min(2, "Slug is required")
    .max(120, "Slug is too long")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens"),
  tagline: trimmed.max(240, "Tagline is too long").optional().default(""),
  summary: trimmed.optional().default(""),
  problem: trimmed.optional().default(""),
  solution: trimmed.optional().default(""),
  features: lineList,
  implementation: trimmed.optional().default(""),
  result: trimmed.optional().default(""),
  tech: lineList,
  imageUrl: assetRef,
  gallery: lineList,
  videoUrl: assetRef,
  videoPosterUrl: assetRef,
  liveUrl: optionalUrl,
  repoUrl: optionalUrl,
  year: trimmed.max(20, "Year is too long").optional().default(""),
  role: trimmed.max(160, "Role is too long").optional().default(""),
  category: z
    .enum(["web-app", "saas", "e-commerce", "experiment"])
    .default("web-app"),
  featured: boolField,
  published: boolField,
  sortOrder: z.coerce.number().int().min(-999).max(999).optional().default(0),
});

export type ProjectInput = z.infer<typeof projectFieldSchema>;

export const experienceFieldSchema = z.object({
  role: requiredText(2, 160, "Role"),
  organization: requiredText(2, 160, "Organization"),
  location: trimmed.max(160, "Location is too long").optional().default(""),
  startDate: requiredText(2, 40, "Start date"),
  endDate: trimmed.max(40, "End date").optional().default(""),
  current: boolField,
  description: trimmed.optional().default(""),
  highlights: lineList,
  sortOrder: z.coerce.number().int().min(-999).max(999).optional().default(0),
});

export type ExperienceInput = z.infer<typeof experienceFieldSchema>;

export const skillFieldSchema = z.object({
  name: requiredText(1, 120, "Name"),
  category: requiredText(2, 120, "Category"),
  level: z
    .union([z.literal(""), trimmed, z.number()])
    .optional()
    .transform((v) => {
      if (v === "" || v === undefined || v === null) return null;
      const n = Number(v);
      if (Number.isNaN(n)) return null;
      return Math.max(0, Math.min(100, Math.round(n)));
    }),
  note: trimmed.max(240, "Note is too long").optional().default(""),
  sortOrder: z.coerce.number().int().min(-999).max(999).optional().default(0),
});

export type SkillInput = z.infer<typeof skillFieldSchema>;

export const educationFieldSchema = z.object({
  degree: requiredText(2, 160, "Degree"),
  institution: requiredText(2, 200, "Institution"),
  location: trimmed.max(160, "Location is too long").optional().default(""),
  startYear: requiredText(2, 20, "Start year"),
  endYear: requiredText(2, 20, "End year"),
  current: boolField,
  description: trimmed.optional().default(""),
  sortOrder: z.coerce.number().int().min(-999).max(999).optional().default(0),
});

export type EducationInput = z.infer<typeof educationFieldSchema>;

export const serviceFieldSchema = z.object({
  title: requiredText(2, 160, "Title"),
  description: requiredText(10, 1200, "Description"),
  deliverables: lineList,
  sortOrder: z.coerce.number().int().min(-999).max(999).optional().default(0),
});

export type ServiceInput = z.infer<typeof serviceFieldSchema>;

export const loginFieldSchema = z.object({
  email: trimmed.email("Enter a valid email address").max(255),
  password: z.string().min(1, "Password is required").max(200),
  redirectTo: trimmed.optional().default("/admin"),
});

export type LoginInput = z.infer<typeof loginFieldSchema>;

/* --------------------------------------------------------------------------
   Shared result shape for every action
   -------------------------------------------------------------------------- */

/**
 * A single object rather than a discriminated union: every consumer needs to
 * read `status`, and most need `message` too. Narrowing is done on `status`,
 * which is why `message` stays optional rather than being narrowed away.
 */
export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export const idleState: ActionState = { status: "idle" };

/** Flattens a ZodError into the shape useActionState components expect. */
export function fieldErrorsFrom(error: z.ZodError) {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    (out[key] ??= []).push(issue.message);
  }
  return out;
}
