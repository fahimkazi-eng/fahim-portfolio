/* Re-hashes the admin password in the database to match ADMIN_PASSWORD.
   Run after changing ADMIN_PASSWORD: node scripts/set-admin-password.mjs

   The password itself is never logged. */

const url = process.env.DATABASE_URL;
const password = process.env.ADMIN_PASSWORD;
const email = process.env.ADMIN_EMAIL;

if (!url || !password || !email) {
  console.error("DATABASE_URL, ADMIN_EMAIL and ADMIN_PASSWORD must all be set.");
  process.exit(1);
}

const { neon } = await import("@neondatabase/serverless");
const bcrypt = (await import("bcryptjs")).default;
const sql = neon(url);

const rows = await sql.query(
  "select id, email, password_hash from admin_users where email = $1",
  [email.toLowerCase().trim()],
);

if (rows.length === 0) {
  console.error(`No admin user found for ${email}. Run "npm run db:seed" instead.`);
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);
await sql.query("update admin_users set password_hash = $1 where id = $2", [hash, rows[0].id]);

const verify = await bcrypt.compare(password, hash);
console.log(`updated password_hash for ${rows[0].email} (id=${rows[0].id})`);
console.log(`re-verifies: ${verify}`);
process.exit(verify ? 0 : 1);
