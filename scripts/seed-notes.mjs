/**
 * Seeds the three published notes from `scripts/content/*.md`.
 *
 * Idempotent: matched by slug, so re-running updates the body in place rather
 * than creating duplicates. Newest-first ordering on the site means UniMate is
 * stamped newest, then the Drizzle walkthrough, then the feature-systems note.
 *
 *   npm run db:seed-notes
 */

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { neon } from "@neondatabase/serverless";

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    if (!existsSync(file)) continue;
    for (const rawLine of readFileSync(file, "utf8").split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  }
}

loadEnv();

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is missing. Add it to .env.local first.");
  process.exit(1);
}
const sql = neon(url);

const here = dirname(fileURLToPath(import.meta.url));
const contentDir = join(here, "content");

const POSTS = [
  {
    slug: "how-i-built-unimate",
    title: "How I Built UniMate",
    excerpt:
      "Notes from turning a university productivity idea into a deployed full-stack product — the data model, the auth boundary, and the decisions that kept it shippable.",
    file: "how-i-built-unimate.md",
    daysAgo: 0,
  },
  {
    slug: "drizzle-orm-with-neon",
    title: "Setting Up Drizzle ORM with Neon",
    excerpt:
      "The exact setup I use for a typed PostgreSQL layer on a serverless host: driver, schema, migrations and queries.",
    file: "drizzle-orm-with-neon.md",
    daysAgo: 1,
  },
  {
    slug: "scalable-feature-system",
    title: "Designing a Scalable Feature System",
    excerpt:
      "Why 'where does this code live?' is a design decision — a small set of rules that keeps a growing codebase navigable.",
    file: "scalable-feature-system.md",
    daysAgo: 2,
  },
];

async function main() {
  for (const post of POSTS) {
    const body = readFileSync(join(contentDir, post.file), "utf8").trim();

    const existing = await sql`
      select id from posts where slug = ${post.slug}
    `;

    if (existing.length) {
      await sql`
        update posts
        set title = ${post.title},
            excerpt = ${post.excerpt},
            body = ${body},
            published = true,
            updated_at = now()
        where slug = ${post.slug}
      `;
      console.log(`updated note: ${post.slug}`);
    } else {
      await sql`
        insert into posts (slug, title, excerpt, body, published, created_at, updated_at)
        values (
          ${post.slug},
          ${post.title},
          ${post.excerpt},
          ${body},
          true,
          now() - (${post.daysAgo} * interval '1 day'),
          now()
        )
      `;
      console.log(`created note: ${post.slug}`);
    }
  }

  const [{ count }] = await sql`select count(*)::int as count from posts`;
  console.log(`posts in database: ${count}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
