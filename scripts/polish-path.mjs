import { readFileSync, existsSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';

function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    if (!existsSync(file)) continue;
    for (const rawLine of readFileSync(file, 'utf8').split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  }
}

loadEnv();
const url = process.env.DATABASE_URL;
if (!url) { console.error('no'); process.exit(1); }
const sql = neon(url);

async function main() {
  await sql`update educations set description='BSc in Computer Science & Engineering at Northern University Bangladesh (2023–2027), focusing on systems, data structures, and building practical projects.' where institution ilike '%Northern%'`;
  await sql`update experiences set description='Volunteer work focused on communication, coordination, and supporting events and initiatives.' where organization ilike '%Volunteer%' or organization ilike '%volunteer%'`;
  console.log('ok');
  process.exit(0);
}

main().catch(e=>{console.error(e);process.exit(1);});
