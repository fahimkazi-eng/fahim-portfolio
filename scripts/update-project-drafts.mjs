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
if (!url) {
  console.error('DATABASE_URL is missing. Add it to .env.local first.');
  process.exit(1);
}

const sql = neon(url);

async function main() {
  await sql`
    update projects set
      title='UniMate',
      tagline='University productivity platform',
      summary='UniMate helps university students stay organized by bringing schedules, assignments, and course information into one simple, focused workspace.',
      problem='University life is scattered across notices, chats, calendars and files, making it hard for students to track deadlines and stay on top of coursework.',
      solution='A focused student workspace that centralizes academic information with a clean, distraction-free interface.',
      features=array['Task and assignment tracking','Course and schedule management','Clean, focused student dashboard','Structured data model for academic content'],
      implementation='Built with Next.js App Router, TypeScript and PostgreSQL via Drizzle ORM. Server actions keep data access type-safe while maintaining a simple component structure.',
      result='A working, structured platform designed to be extended as academic needs grow. No fabricated usage metrics.',
      tech=array['Next.js','TypeScript','PostgreSQL','Drizzle ORM','Tailwind CSS'],
      role='Full-stack Developer & Product Designer',
      updated_at=now()
    where slug='unimate'
  `;
  
  await sql`
    update projects set
      title='FixBondhu',
      tagline='Bangladesh local services marketplace',
      summary='FixBondhu connects service providers and customers in Bangladesh, making it easier to find, request and manage local services in one place.',
      problem='Finding reliable local service providers is often informal and time-consuming, with limited structure for requests and tracking.',
      solution='A marketplace approach that matches customers with service providers, keeping requests organized and transparent.',
      features=array['Service provider and customer flows','Request management','Location-aware structure','Clean, accessible interface'],
      implementation='Next.js + TypeScript with PostgreSQL/Drizzle for structured data. Focused on clear user flows and maintainable schema.',
      result='Solid foundation for a Bangladesh-focused services marketplace, built for iterative improvement.',
      tech=array['Next.js','TypeScript','PostgreSQL','Drizzle ORM','Tailwind CSS'],
      role='Full-stack Developer',
      updated_at=now()
    where slug='fixbondhu'
  `;
  
  await sql`
    update projects set
      title='Lumina Digital',
      tagline='Digital products storefront',
      summary='Lumina Digital is a digital products e-commerce storefront with Stripe integration, focused on a clean, editorial shopping experience.',
      problem='Selling digital products needs a simple checkout flow and clear product presentation without unnecessary friction.',
      solution='Minimal storefront with Stripe-powered checkout and a focused product catalog.',
      features=array['Product catalog and listings','Secure checkout with Stripe','Digital delivery considerations','Clean editorial product pages'],
      implementation='Built on Next.js with TypeScript, PostgreSQL/Drizzle for products/orders data, and Stripe for payments.',
      result='Working storefront foundation ready to scale with more products and improved delivery flow.',
      tech=array['Next.js','TypeScript','PostgreSQL','Drizzle ORM','Stripe','Tailwind CSS'],
      role='Full-stack Developer',
      updated_at=now()
    where slug='lumina-digital'
  `;
  
  console.log('Done');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
