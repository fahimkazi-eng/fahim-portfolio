/* Read-only sanity check over the seeded content.
   Run: node scripts/check-db.mjs  (requires DATABASE_URL in the env) */

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const { neon } = await import("@neondatabase/serverless");
const sql = neon(url);

const tables = [
  "admin_users",
  "projects",
  "experiences",
  "educations",
  "skills",
  "services",
  "contact_messages",
];

for (const table of tables) {
  const rows = await sql.query(`select count(*)::int as c from ${table}`);
  console.log(`${table.padEnd(18)} ${rows[0].c}`);
}

const projects = await sql.query(
  "select slug, published, featured, (problem is null or problem = '') as no_problem, (features::text = '[]') as no_features from projects order by sort_order",
);
console.log("\nprojects:");
for (const p of projects) {
  console.log(
    `  ${p.slug.padEnd(14)} published=${p.published} featured=${p.featured} problem_missing=${p.no_problem} features_missing=${p.no_features}`,
  );
}

const users = await sql.query("select email, name, (password_hash like '$2%') as bcrypt from admin_users");
console.log("\nadmin users:");
for (const u of users) console.log(`  ${u.email} (${u.name}) bcrypt_hash=${u.bcrypt}`);
