/* Seed the 09 More Builds archive with REAL public repos, verified via the
   GitHub API on 2026-10-09 (owner: fahimkazi-eng). Every summary below is
   drawn from the repo's own README/description — nothing invented.
   Idempotent: rows keyed by slug, existing slugs are left untouched.
   Run: node scripts/with-env.mjs node scripts/seed-archive.mjs */

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const { neon } = await import("@neondatabase/serverless");
const sql = neon(url);

const rows = [
  {
    slug: "sentineltrack",
    title: "SentinelTrack",
    tagline: "Security operations dashboard — frontend MVP",
    summary:
      "A cybersecurity asset and incident tracking platform for monitoring assets, incidents, risk levels and operational activity from a central dashboard. Version 0.1 frontend MVP, working toward a full-stack application.",
    tech: ["HTML", "CSS", "JavaScript"],
    repo_url: "https://github.com/fahimkazi-eng/sentineltrack",
    role: "Design & build",
    category: "experiment",
    sort_order: 10,
  },
  {
    slug: "student-grade-calculator",
    title: "Student Grade Calculator",
    tagline: "A beginner web development project",
    summary:
      "A simple web-based grade calculator — enter marks for three subjects, see totals and averages, and get the grade automatically. Built to practice HTML structure, CSS styling and JavaScript fundamentals.",
    tech: ["HTML", "CSS", "JavaScript"],
    repo_url: "https://github.com/fahimkazi-eng/student-grade-calculator",
    role: "Design & build",
    category: "experiment",
    sort_order: 20,
  },
  {
    slug: "clientflow-crm",
    title: "ClientFlow CRM",
    tagline: "CRM platform concept",
    summary:
      "A CRM platform concept for managing clients, leads, deals, tasks and business activities. An early prototype on the way to a full-stack product.",
    tech: ["HTML", "CSS", "JavaScript"],
    repo_url: "https://github.com/fahimkazi-eng/clientflow-crm",
    role: "Design & build",
    category: "experiment",
    sort_order: 30,
  },
  {
    slug: "portfolio-v1",
    title: "Portfolio v1",
    tagline: "The earlier portfolio",
    summary:
      "The first version of this portfolio — projects, skills and the journey as a developer and cybersecurity enthusiast. Superseded by the current build.",
    tech: ["HTML", "CSS"],
    repo_url: "https://github.com/fahimkazi-eng/fahimkazi-portfolio",
    role: "Design & build",
    category: "experiment",
    sort_order: 40,
  },
];

let inserted = 0;
for (const row of rows) {
  const existing = await sql.query("select id from projects where slug = $1", [
    row.slug,
  ]);
  if (existing.length) {
    console.log(`${row.slug}: exists, skipped`);
    continue;
  }
  await sql.query(
    `insert into projects
       (title, slug, tagline, summary, tech, repo_url, role, category,
        featured, published, sort_order, created_at, updated_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8, false, true, $9, now(), now())`,
    [
      row.title,
      row.slug,
      row.tagline,
      row.summary,
      row.tech,
      row.repo_url,
      row.role,
      row.category,
      row.sort_order,
    ],
  );
  inserted += 1;
  console.log(`${row.slug}: inserted`);
}

console.log(inserted ? `${inserted} archive project(s) inserted.` : "No-op.");