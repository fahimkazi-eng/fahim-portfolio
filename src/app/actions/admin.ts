"use server";

import { redirect } from "next/navigation";
import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  contactMessages,
  educations,
  experiences,
  projects,
  services,
  skills,
} from "@/lib/db/schema";
import {
  authenticate,
  createSession,
  destroySession,
  requireUser,
  touchLastLogin,
} from "@/lib/auth";
import {
  educationFieldSchema,
  experienceFieldSchema,
  fieldErrorsFrom,
  loginFieldSchema,
  projectFieldSchema,
  serviceFieldSchema,
  skillFieldSchema,
  type ActionState,
} from "@/lib/validations/schemas";
import { slugify } from "@/lib/utils";

/* ==========================================================================
   Admin Server Actions

   Every action follows the same contract:
     1. requireUser()  — real auth check, regardless of proxy.ts
     2. validate       — the same Zod schema the form used
     3. write          — scoped .where() so a crafted id cannot touch other rows
     4. revalidatePath — so the public page reflects the change
     5. return         — ActionState for useActionState
   ========================================================================== */

const UNAUTHORISED: ActionState = {
  status: "error",
  message: "Your session expired. Sign in again to continue.",
};

function revalidatePublic() {
  revalidatePath("/");
  revalidatePath("/work");
}

/* -------------------------------------------------------------------------
   Auth
   -------------------------------------------------------------------------- */

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginFieldSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    redirectTo: formData.get("redirectTo") ?? "/admin",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check your email and password.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  const { email, password, redirectTo } = parsed.data;
  const user = await authenticate(email, password);

  if (!user) {
    // Deliberately vague: never reveal whether the email exists.
    return {
      status: "error",
      message: "Those credentials were not recognised.",
    };
  }

  await createSession(user);
  await touchLastLogin(user.id);

  /* Only same-origin relative redirects are honoured. `redirectTo` comes from
     a hidden form field, so it is untrusted input; the check above is the
     entire security boundary for this value. `typedRoutes` cannot know a
     runtime string is a valid route, hence the assertion. */
  const target =
    redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/admin";

  redirect(target as Route);
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}

/* -------------------------------------------------------------------------
   Contact messages
   -------------------------------------------------------------------------- */

export async function markMessageReadAction(formData: FormData) {
  await requireUser();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;

  await db
    .update(contactMessages)
    .set({ read: true })
    .where(eq(contactMessages.id, id));
  revalidatePath("/admin/messages");
}

export async function deleteMessageAction(formData: FormData) {
  await requireUser();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;

  await db.delete(contactMessages).where(eq(contactMessages.id, id));
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
}

/* -------------------------------------------------------------------------
   Projects
   -------------------------------------------------------------------------- */

export async function saveProjectAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requireUser();
  } catch {
    return UNAUTHORISED;
  }

  const id = Number(formData.get("id")) || null;

  const parsed = projectFieldSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    tagline: formData.get("tagline") ?? "",
    summary: formData.get("summary") ?? "",
    problem: formData.get("problem") ?? "",
    solution: formData.get("solution") ?? "",
    features: formData.get("features") ?? "",
    implementation: formData.get("implementation") ?? "",
    result: formData.get("result") ?? "",
    tech: formData.get("tech") ?? "",
    imageUrl: formData.get("imageUrl") ?? "",
    gallery: formData.get("gallery") ?? "",
    videoUrl: formData.get("videoUrl") ?? "",
    videoPosterUrl: formData.get("videoPosterUrl") ?? "",
    liveUrl: formData.get("liveUrl") ?? "",
    repoUrl: formData.get("repoUrl") ?? "",
    year: formData.get("year") ?? "",
    role: formData.get("role") ?? "",
    featured: formData.get("featured") ?? false,
    published: formData.get("published") ?? false,
    sortOrder: formData.get("sortOrder") ?? 0,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Some fields need attention.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  const data = parsed.data;
  // Slug is required by the schema, but fall back to the title server-side so
  // a hand-crafted POST cannot create an unroutable record.
  data.slug = data.slug || slugify(data.title);

  try {
    if (id) {
      await db
        .update(projects)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(projects.id, id));
    } else {
      await db.insert(projects).values(data);
    }
  } catch (error) {
    const message =
      error instanceof Error && /unique|duplicate/i.test(error.message)
        ? "That slug is already taken by another project."
        : "The project could not be saved. Try again.";
    return { status: "error", message };
  }

  revalidatePublic();
  revalidatePath("/admin/projects");
  return {
    status: "success",
    message: id ? "Project updated." : "Project created.",
  };
}

export async function deleteProjectAction(formData: FormData) {
  try {
    await requireUser();
  } catch {
    return;
  }

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;

  await db.delete(projects).where(eq(projects.id, id));
  revalidatePublic();
  revalidatePath("/admin/projects");
}

export async function toggleProjectFlagAction(formData: FormData) {
  try {
    await requireUser();
  } catch {
    return;
  }

  const id = Number(formData.get("id"));
  const field = String(formData.get("field"));
  if (!Number.isInteger(id)) return;
  if (field !== "featured" && field !== "published") return;

  await db
    .update(projects)
    .set({ [field]: sql`not ${field}`, updatedAt: new Date() })
    .where(eq(projects.id, id));

  revalidatePublic();
  revalidatePath("/admin/projects");
}

export async function reorderProjectsAction(formData: FormData) {
  try {
    await requireUser();
  } catch {
    return;
  }

  const ids = formData.getAll("id").map(Number).filter(Number.isInteger);
  if (!ids.length) return;

  for (const [index, id] of ids.entries()) {
    await db
      .update(projects)
      .set({ sortOrder: index, updatedAt: new Date() })
      .where(eq(projects.id, id));
  }

  revalidatePublic();
  revalidatePath("/admin/projects");
}

/* -------------------------------------------------------------------------
   Experience
   -------------------------------------------------------------------------- */

export async function saveExperienceAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requireUser();
  } catch {
    return UNAUTHORISED;
  }

  const id = Number(formData.get("id")) || null;

  const parsed = experienceFieldSchema.safeParse({
    role: formData.get("role"),
    organization: formData.get("organization"),
    location: formData.get("location") ?? "",
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate") ?? "",
    current: formData.get("current") ?? false,
    description: formData.get("description") ?? "",
    highlights: formData.get("highlights") ?? "",
    sortOrder: formData.get("sortOrder") ?? 0,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Some fields need attention.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  const data = parsed.data;

  try {
    if (id) {
      await db
        .update(experiences)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(experiences.id, id));
    } else {
      await db.insert(experiences).values(data);
    }
  } catch {
    return { status: "error", message: "The role could not be saved." };
  }

  revalidatePublic();
  revalidatePath("/admin/experience");
  return {
    status: "success",
    message: id ? "Role updated." : "Role added.",
  };
}

export async function deleteExperienceAction(formData: FormData) {
  try {
    await requireUser();
  } catch {
    return;
  }
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;

  await db.delete(experiences).where(eq(experiences.id, id));
  revalidatePublic();
  revalidatePath("/admin/experience");
}

/* -------------------------------------------------------------------------
   Skills
   -------------------------------------------------------------------------- */

export async function saveSkillAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requireUser();
  } catch {
    return UNAUTHORISED;
  }

  const id = Number(formData.get("id")) || null;

  const parsed = skillFieldSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    level: formData.get("level") ?? "",
    note: formData.get("note") ?? "",
    sortOrder: formData.get("sortOrder") ?? 0,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Some fields need attention.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  try {
    if (id) {
      await db
        .update(skills)
        .set({ ...parsed.data, updatedAt: new Date() })
        .where(eq(skills.id, id));
    } else {
      await db.insert(skills).values(parsed.data);
    }
  } catch {
    return { status: "error", message: "The skill could not be saved." };
  }

  revalidatePublic();
  revalidatePath("/admin/skills");
  return { status: "success", message: id ? "Skill updated." : "Skill added." };
}

export async function deleteSkillAction(formData: FormData) {
  try {
    await requireUser();
  } catch {
    return;
  }
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;

  await db.delete(skills).where(eq(skills.id, id));
  revalidatePublic();
  revalidatePath("/admin/skills");
}

/* -------------------------------------------------------------------------
   Education
   -------------------------------------------------------------------------- */

export async function saveEducationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requireUser();
  } catch {
    return UNAUTHORISED;
  }

  const id = Number(formData.get("id")) || null;

  const parsed = educationFieldSchema.safeParse({
    degree: formData.get("degree"),
    institution: formData.get("institution"),
    location: formData.get("location") ?? "",
    startYear: formData.get("startYear"),
    endYear: formData.get("endYear"),
    current: formData.get("current") ?? false,
    description: formData.get("description") ?? "",
    sortOrder: formData.get("sortOrder") ?? 0,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Some fields need attention.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  try {
    if (id) {
      await db
        .update(educations)
        .set({ ...parsed.data, updatedAt: new Date() })
        .where(eq(educations.id, id));
    } else {
      await db.insert(educations).values(parsed.data);
    }
  } catch {
    return { status: "error", message: "The entry could not be saved." };
  }

  revalidatePublic();
  revalidatePath("/admin/education");
  return { status: "success", message: id ? "Updated." : "Added." };
}

export async function deleteEducationAction(formData: FormData) {
  try {
    await requireUser();
  } catch {
    return;
  }
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;

  await db.delete(educations).where(eq(educations.id, id));
  revalidatePublic();
  revalidatePath("/admin/education");
}

/* -------------------------------------------------------------------------
   Services
   -------------------------------------------------------------------------- */

export async function saveServiceAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requireUser();
  } catch {
    return UNAUTHORISED;
  }

  const id = Number(formData.get("id")) || null;

  const parsed = serviceFieldSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    deliverables: formData.get("deliverables") ?? "",
    sortOrder: formData.get("sortOrder") ?? 0,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Some fields need attention.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  try {
    if (id) {
      await db
        .update(services)
        .set({ ...parsed.data, updatedAt: new Date() })
        .where(eq(services.id, id));
    } else {
      await db.insert(services).values(parsed.data);
    }
  } catch {
    return { status: "error", message: "The service could not be saved." };
  }

  revalidatePublic();
  revalidatePath("/admin/services");
  return { status: "success", message: id ? "Updated." : "Added." };
}

export async function deleteServiceAction(formData: FormData) {
  try {
    await requireUser();
  } catch {
    return;
  }
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;

  await db.delete(services).where(eq(services.id, id));
  revalidatePublic();
  revalidatePath("/admin/services");
}

/* -------------------------------------------------------------------------
   Dashboard helpers
   -------------------------------------------------------------------------- */

export async function publishAllDraftsAction() {
  try {
    await requireUser();
  } catch {
    return;
  }

  await db
    .update(projects)
    .set({ published: true, updatedAt: new Date() })
    .where(and(eq(projects.published, false)));
  revalidatePublic();
  revalidatePath("/admin/projects");
}
