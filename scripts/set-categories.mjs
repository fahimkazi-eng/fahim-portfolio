/* One-off backfill: assign real filter categories to the seeded projects.
   Facts come from the products themselves:
   - UniMate      = student platform  -> web-app (column default)
   - FixBondhu    = service booking   -> saas
   - Lumina       = agency site       -> web-app
   Run: node scripts/with-env.mjs node scripts/set-categories.mjs */

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const { neon } = await import("@neondatabase/serverless");
const sql = neon(url);

const rows = await sql.query("select slug, category from projects order by slug");

const fixes = new Map([
  ["fixbondhu", "saas"],
  ["unimate", "web-app"],
  ["lumina-digital", "web-app"],
]);

let changed = 0;
for (const row of rows) {
  const want = fixes.get(row.slug);
  if (want && want !== row.category) {
    await sql.query("update projects set category = $1 where slug = $2", [
      want,
      row.slug,
    ]);
    changed += 1;
    console.log(`${row.slug}: web-app -> ${want}`);
  }
}
console.log(changed ? `${changed} project(s) updated.` : "Nothing to update.");