/* Seed the 11 Uses section with ONLY the stack verified in package.json and
   the codebase itself — no invented tools, no hardware claims.
   Idempotent: keyed by name+category, existing rows are left untouched.
   Run: node scripts/with-env.mjs node scripts/seed-uses.mjs */

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const { neon } = await import("@neondatabase/serverless");
const sql = neon(url);

const rows = [
  { name: "Next.js 16", category: "Frontend", note: "App Router, Server Components and Server Actions — this site runs on it." },
  { name: "TypeScript", category: "Frontend", note: "Strict types across the whole repository." },
  { name: "Tailwind CSS v4", category: "Frontend", note: "Design tokens as one CSS file; everything else is utilities." },
  { name: "Neon Postgres", category: "Backend & data", note: "Serverless Postgres — the live database behind this site." },
  { name: "Drizzle ORM", category: "Backend & data", note: "Schema, typed queries and migrations." },
  { name: "Resend", category: "Backend & data", note: "Transactional email for the contact form." },
  { name: "GSAP", category: "Motion & WebGL", note: "ScrollTrigger reveals and scrub animations." },
  { name: "Motion", category: "Motion & WebGL", note: "Springs and enter/exit transitions." },
  { name: "Lenis", category: "Motion & WebGL", note: "Smooth scrolling on the homepage." },
  { name: "OGL", category: "Motion & WebGL", note: "The WebGL aurora background and lab shader." },
];

let inserted = 0;
for (const row of rows) {
  const existing = await sql.query(
    "select id from uses_items where name = $1 and category = $2",
    [row.name, row.category],
  );
  if (existing.length) {
    console.log(`${row.category} / ${row.name}: exists, skipped`);
    continue;
  }
  await sql.query(
    `insert into uses_items (name, category, note, sort_order, created_at, updated_at)
     values ($1, $2, $3, $4, now(), now())`,
    [row.name, row.category, row.note, 0],
  );
  inserted += 1;
  console.log(`${row.category} / ${row.name}: inserted`);
}

console.log(inserted ? `${inserted} uses item(s) inserted.` : "No-op.");