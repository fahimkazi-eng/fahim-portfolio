import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Content tables are ordered via a plain `sortOrder` column rather than
 * `createdAt` so the admin can curate the order of the page.
 */

export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  title: varchar("title", { length: 160 }).notNull(),
  tagline: varchar("tagline", { length: 240 }),
  summary: text("summary"),
  /** Problem → Solution → Features → Implementation → Result */
  problem: text("problem"),
  solution: text("solution"),
  features: text("features").array().notNull().default([]),
  implementation: text("implementation"),
  result: text("result"),
  tech: text("tech").array().notNull().default([]),
  imageUrl: text("image_url"),
  /** Optional gallery of image paths/URLs, ordered. */
  gallery: text("gallery").array().notNull().default([]),
  /**
   * A real screen recording of the product, if one exists.
   *
   * When set, this is what the case study presents as its primary visual —
   * a short demo says more than any screenshot, and it is the one asset that
   * cannot be faked, because it is the product actually running. When null the
   * case study falls back to the still image, and then to the generative
   * signature, so the page never has an empty hole in it.
   */
  videoUrl: text("video_url"),
  /**
   * Poster frame shown before playback, and the box the browser reserves while
   * `preload="none"` fetches nothing. Optional: without it the browser uses
   * the first frame, which costs a full-file request to discover.
   */
  videoPosterUrl: text("video_poster_url"),
  liveUrl: text("live_url"),
  repoUrl: text("repo_url"),
  year: varchar("year", { length: 20 }),
  role: varchar("role", { length: 160 }),
  /**
   * Filter bucket for the featured grid: web-app | saas | e-commerce |
   * experiment. Defaults to web-app so existing rows sort into a real pill.
   */
  category: varchar("category", { length: 40 }).notNull().default("web-app"),
  featured: boolean("featured").notNull().default(false),
  published: boolean("published").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const experiences = pgTable("experiences", {
  id: serial("id").primaryKey(),
  role: varchar("role", { length: 160 }).notNull(),
  organization: varchar("organization", { length: 160 }).notNull(),
  location: varchar("location", { length: 160 }),
  startDate: varchar("start_date", { length: 40 }).notNull(),
  endDate: varchar("end_date", { length: 40 }).notNull(),
  /** True when the role is ongoing; renders as "Present". */
  current: boolean("current").notNull().default(false),
  description: text("description"),
  highlights: text("highlights").array().notNull().default([]),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const skills = pgTable("skills", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  category: varchar("category", { length: 120 }).notNull(),
  /** Optional 0-100 value. Left null when not self-assessed. */
  level: integer("level"),
  note: varchar("note", { length: 240 }),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const educations = pgTable("educations", {
  id: serial("id").primaryKey(),
  degree: varchar("degree", { length: 160 }).notNull(),
  institution: varchar("institution", { length: 200 }).notNull(),
  location: varchar("location", { length: 160 }),
  startYear: varchar("start_year", { length: 20 }).notNull(),
  endYear: varchar("end_year", { length: 20 }).notNull(),
  current: boolean("current").notNull().default(false),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 160 }).notNull(),
  description: text("description").notNull(),
  deliverables: text("deliverables").array().notNull().default([]),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  title: varchar("title", { length: 200 }).notNull(),
  excerpt: text("excerpt"),
  body: text("body").notNull(),
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const usesItems = pgTable("uses_items", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  category: varchar("category", { length: 120 }).notNull(),
  /** Optional one-line "why" — left empty when there is nothing honest to say. */
  note: varchar("note", { length: 240 }),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 120 }).notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 200 }),
  message: text("message").notNull(),
  /** false | pending | sent | failed */
  emailStatus: varchar("email_status", { length: 20 })
    .notNull()
    .default("false"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Experience = typeof experiences.$inferSelect;
export type NewExperience = typeof experiences.$inferInsert;
export type Skill = typeof skills.$inferSelect;
export type NewSkill = typeof skills.$inferInsert;
export type Education = typeof educations.$inferSelect;
export type NewEducation = typeof educations.$inferInsert;
export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type UsesItem = typeof usesItems.$inferSelect;
export type NewUsesItem = typeof usesItems.$inferInsert;
export type ContactMessage = typeof contactMessages.$inferSelect;
export type NewContactMessage = typeof contactMessages.$inferInsert;
export type AdminUser = typeof adminUsers.$inferSelect;
