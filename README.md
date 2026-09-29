# Kazi Fahim — Portfolio

A full-stack personal portfolio for **Kazi Fahim**, a Computer Science &
Engineering student and software developer. Next.js App Router, TypeScript,
Tailwind v4, and PostgreSQL — with every piece of content driven by the
database and editable from a password-protected dashboard.

## What makes it different

Content is **not** hardcoded. Projects, work history, education, skills,
services and contact messages all live in Postgres. Editing any of them in the
admin dashboard updates the public site on the next request.

More importantly, the site **does not invent facts**. Any field that has not
actually been filled in renders as a visible, labelled placeholder
(`TBD`, "0 of 5 sections written", "Screenshot pending") rather than
plausible-sounding filler. An unfinished case study reads as unfinished.

## Stack

- **Framework** — Next.js 16.3.7 (App Router, Turbopack), React 19
- **Language** — TypeScript, strict
- **Styling** — Tailwind v4 with a custom design system in `src/app/globals.css`
- **Database** — Neon Postgres via `@neondatabase/serverless` (HTTP driver)
- **ORM** — Drizzle ORM + Drizzle Kit migrations
- **Auth** — `bcrypt` password hashing, `jose` HS256 JWT in an httpOnly cookie
- **Motion** — Lenis (scroll), GSAP + ScrollTrigger (scroll-linked), Motion
  (discrete UI). See [`MOTION.md`](./MOTION.md) for the ownership rules.
- **WebGL** — OGL, a single full-screen fragment shader for the hero field
- **Validation** — Zod, shared between client forms and Server Actions

## Local setup

```bash
npm install
cp .env.example .env.local   # then fill in the values
```

Required environment variables:

| Variable         | Purpose                                              |
| ---------------- | ---------------------------------------------------- |
| `DATABASE_URL`   | Neon Postgres connection string                      |
| `AUTH_SECRET`    | 32-byte random hex, signs the admin session cookie   |
| `ADMIN_EMAIL`    | Login for the seed script                            |
| `ADMIN_PASSWORD` | Password for the seed script                         |

Generate a secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Optional — when set, contact submissions also send an email. Without it the
site degrades gracefully and still stores every message with
`email_status: "false"`:

| Variable                | Purpose                              |
| ----------------------- | ------------------------------------ |
| `RESEND_API_KEY`        | Resend API key                       |
| `CONTACT_NOTIFY_EMAIL`  | Where notifications are delivered    |

Create the schema and seed the admin user:

```bash
npm run db:setup
```

Then:

```bash
npm run dev      # http://localhost:3000
```

## Scripts

| Script                 | Does                                                    |
| ---------------------- | ------------------------------------------------------- |
| `npm run dev`          | Development server                                      |
| `npm run build`        | Production build                                        |
| `npm run typecheck`    | `tsc --noEmit`                                          |
| `npm run lint`         | ESLint                                                  |
| `npm run db:generate`  | Generate a migration from schema changes                |
| `npm run db:migrate`   | Apply pending migrations                                |
| `npm run db:seed`      | Seed the admin user and starter content                 |
| `npm run db:check`     | Read-only row counts and content sanity check           |
| `npm run db:set-password` | Re-hash the admin password to match `ADMIN_PASSWORD` |

> `drizzle-kit` reads `.env`, not `.env.local`. Export `DATABASE_URL` in your
> shell before running the `db:*` scripts.

## Routes

| Route                    | Purpose                                           |
| ------------------------ | ------------------------------------------------- |
| `/`                      | Homepage — hero through contact                   |
| `/work/[slug]`           | Full case study, Problem → Solution → … → Result   |
| `/admin/login`           | Sign in                                           |
| `/admin`                 | Dashboard overview                                |
| `/admin/projects`        | Project CRUD (create, edit, reorder, publish)     |
| `/admin/messages`        | Contact submissions, mark read / delete           |
| `/admin/experience` etc. | Experience, education, skills, services CRUD      |
| `/sitemap.xml`, `/robots.txt` | Generated SEO files                          |

## Security notes

- `/admin` is guarded twice: `src/proxy.ts` redirects at the edge, and every
  mutating Server Action calls `requireUser()` independently. The proxy is a
  convenience, never the only check.
- Every admin action re-checks the session server-side, so a forged request
  without a valid cookie changes nothing.
- `.env*` is gitignored. `AUTH_SECRET` and the admin password are **not** in
  the repository.
- Rotating `AUTH_SECRET` invalidates all existing sessions.

## Content model

Eight tables in `src/lib/db/schema.ts`: `admin_users`, `projects`,
`experiences`, `educations`, `skills`, `services`, `contact_messages`,
`site_settings`. Ordering is an explicit `sort_order` column rather than
`created_at`, so the page order is curated rather than chronological.

## License

Personal project. The code is here to read; the content, copy and design
belong to Kazi Fahim.
