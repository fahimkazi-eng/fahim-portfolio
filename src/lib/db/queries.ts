import "server-only";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "./index";
import {
  contactMessages,
  educations,
  experiences,
  projects,
  services,
  siteSettings,
  skills,
} from "./schema";

/* -------------------------------------------------------------------------
   Projects
   ------------------------------------------------------------------------- */

export async function getPublishedProjects() {
  return db
    .select()
    .from(projects)
    .where(eq(projects.published, true))
    .orderBy(asc(projects.sortOrder), asc(projects.id));
}

export async function getFeaturedProjects() {
  return db
    .select()
    .from(projects)
    .where(and(eq(projects.published, true), eq(projects.featured, true)))
    .orderBy(asc(projects.sortOrder), asc(projects.id));
}

export async function getProjectBySlug(slug: string) {
  const rows = await db
    .select()
    .from(projects)
    .where(and(eq(projects.slug, slug), eq(projects.published, true)))
    .limit(1);
  return rows[0] ?? null;
}

export async function getAllProjects() {
  return db
    .select()
    .from(projects)
    .orderBy(asc(projects.sortOrder), asc(projects.id));
}

export async function getProjectById(id: number) {
  const rows = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return rows[0] ?? null;
}

/* -------------------------------------------------------------------------
   Path (experience + education)
   ------------------------------------------------------------------------- */

export async function getExperiences() {
  return db
    .select()
    .from(experiences)
    .orderBy(asc(experiences.sortOrder), asc(experiences.id));
}

export async function getEducations() {
  return db
    .select()
    .from(educations)
    .orderBy(asc(educations.sortOrder), asc(educations.id));
}

/* -------------------------------------------------------------------------
   Skills / services
   ------------------------------------------------------------------------- */

export async function getSkills() {
  return db
    .select()
    .from(skills)
    .orderBy(asc(skills.category), asc(skills.sortOrder), asc(skills.id));
}

export async function getServices() {
  return db
    .select()
    .from(services)
    .orderBy(asc(services.sortOrder), asc(services.id));
}

/* -------------------------------------------------------------------------
   Contact messages
   ------------------------------------------------------------------------- */

export async function getMessages(opts?: { unreadOnly?: boolean }) {
  return db
    .select()
    .from(contactMessages)
    .where(
      opts?.unreadOnly ? eq(contactMessages.read, false) : undefined,
    )
    .orderBy(desc(contactMessages.createdAt));
}

export async function getUnreadMessageCount() {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(contactMessages)
    .where(eq(contactMessages.read, false));
  return row?.count ?? 0;
}

/* -------------------------------------------------------------------------
   Site settings (editable copy blocks)
   ------------------------------------------------------------------------- */

export async function getSetting(key: string) {
  const rows = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.key, key))
    .limit(1);
  return rows[0]?.value ?? null;
}

export async function getAllSettings() {
  const rows = await db.select().from(siteSettings);
  return Object.fromEntries(rows.map((r) => [r.key, r.value])) as Record<
    string,
    string
  >;
}

/* -------------------------------------------------------------------------
   Dashboard counters
   ------------------------------------------------------------------------- */

export async function getDashboardCounts() {
  const [projectsCount, messagesCount, unreadCount, experienceCount] =
    await Promise.all([
      db.select({ n: sql<number>`count(*)::int` }).from(projects),
      db.select({ n: sql<number>`count(*)::int` }).from(contactMessages),
      db
        .select({ n: sql<number>`count(*)::int` })
        .from(contactMessages)
        .where(eq(contactMessages.read, false)),
      db.select({ n: sql<number>`count(*)::int` }).from(experiences),
    ]);

  return {
    projects: projectsCount[0]?.n ?? 0,
    messages: messagesCount[0]?.n ?? 0,
    unread: unreadCount[0]?.n ?? 0,
    experience: experienceCount[0]?.n ?? 0,
  };
}
