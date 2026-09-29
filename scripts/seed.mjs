/**
 * Idempotent seed for the admin account and initial portfolio content.
 * Plain ESM + raw SQL so it runs under bare Node with no TS loader.
 *
 *   npm run db:seed
 */

import { readFileSync, existsSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

/* ---- minimal .env.local loader (no dotenv dependency) ---- */
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

async function main() {
  /* ---------------- admin ---------------- */

  const email = (process.env.ADMIN_EMAIL ?? "").toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD ?? "";

  if (!email || !password) {
    console.warn("ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin seed.");
  } else {
    const existing = await sql`select id from admin_users where email = ${email}`;
    if (existing.length) {
      console.log(`admin user already exists: ${email}`);
    } else {
      const hash = await bcrypt.hash(password, 12);
      await sql`
        insert into admin_users (email, password_hash, name)
        values (${email}, ${hash}, ${'Kazi Fahim'})
      `;
      console.log(`created admin user: ${email}`);
    }
  }

  /* ---------------- projects ---------------- */

  const [{ count: projectCount }] = await sql`select count(*)::int as count from projects`;

  if (projectCount === 0) {
    await sql`
      insert into projects (slug, title, tagline, summary, featured, published, sort_order)
      values
        ('unimate', 'Unimate', 'University platform',
         'A university platform. Case study content to be supplied by the owner.',
         true, true, 0),
        ('fixbondhu', 'FixBondhu', 'E-commerce / service platform',
         'A local services marketplace for Bangladesh. Case study content to be supplied by the owner.',
         true, true, 1)
    `;
    console.log("seeded 2 projects");
  }

  /* ---------------- experience ---------------- */

  const [{ count: expCount }] = await sql`select count(*)::int as count from experiences`;

  if (expCount === 0) {
    await sql`
      insert into experiences (role, organization, start_date, end_date, current, sort_order)
      values
        ('Sales & Customer Service Representative', 'Skytech Solutions', '2023', '2024', false, 0),
        ('Volunteer', 'VSO', '2018', '2019', false, 1)
    `;
    console.log("seeded 2 experiences");
  }

  /* ---------------- education ---------------- */

  const [{ count: eduCount }] = await sql`select count(*)::int as count from educations`;

  if (eduCount === 0) {
    await sql`
      insert into educations (degree, institution, start_year, end_year, current, sort_order)
      values ('BSc in Computer Science & Engineering', 'Northern University Bangladesh', '2023', '2027', true, 0)
    `;
    console.log("seeded 1 education");
  }

  /* ---------------- skills ---------------- */

  const [{ count: skillCount }] = await sql`select count(*)::int as count from skills`;

  if (skillCount === 0) {
    const names = [
      "Project Management",
      "Public Relations",
      "Teamwork",
      "Time Management",
      "Leadership",
      "Effective Communication",
      "Critical Thinking",
    ];
    for (const [i, name] of names.entries()) {
      await sql`
        insert into skills (name, category, sort_order)
        values (${name}, ${"Professional"}, ${i})
      `;
    }
    console.log(`seeded ${names.length} skills`);
  }

  /* ---------------- services ---------------- */

  const [{ count: serviceCount }] = await sql`select count(*)::int as count from services`;

  if (serviceCount === 0) {
    const rows = [
      {
        title: "Full-stack web applications",
        description:
          "Complete products built end to end — from relational schema and authentication through to a polished, accessible interface.",
        deliverables: [
          "Data model & migrations",
          "Authenticated CRUD",
          "Server actions / API layer",
          "Responsive UI",
        ],
        sort_order: 0,
      },
      {
        title: "Interface engineering",
        description:
          "Design systems and motion work that ships as real code, not a Figma file. Accessible, keyboard-navigable and fast.",
        deliverables: [
          "Design tokens & primitives",
          "Motion & interaction design",
          "Accessibility pass",
          "Performance budget",
        ],
        sort_order: 1,
      },
      {
        title: "Technical project leadership",
        description:
          "Scoping, sprint planning, team coordination and handover documentation for student and early-stage product teams.",
        deliverables: [
          "Scope & milestone plan",
          "Task breakdown",
          "Progress reporting",
          "Handover docs",
        ],
        sort_order: 2,
      },
    ];
    for (const row of rows) {
      await sql`
        insert into services (title, description, deliverables, sort_order)
        values (${row.title}, ${row.description}, ${row.deliverables}, ${row.sort_order})
      `;
    }
    console.log(`seeded ${rows.length} services`);
  }

  console.log("seed complete");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
