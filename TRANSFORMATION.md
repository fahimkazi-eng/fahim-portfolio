# TRANSFORMATION — Visual Reference Fidelity

Goal: turn the existing portfolio into the reference dark-cinematic editorial
design. Architecture preserved (Next 16 / React 19 / TS / Tailwind v4 / Neon /
Drizzle / Zod / GSAP / Motion / Lenis / OGL / admin / DB-driven content).

> Status note: the reference image file did not reach the working environment
> (searched Downloads, Desktop, temp, opencode data dirs). Work is driven by the
> written specification. When the image is available, run a visual fidelity
> pass and close gaps.

## Design contract (from the brief)

- Almost-black / midnight canvas, deep blue atmospheric lighting.
- Restrained accent set: electric blue (primary), cyan + violet (secondary),
  magenta strictly for atmospheric highlights.
- Thin technical borders, hairline separators, dense editorial grids.
- Large display type (Bricolage Grotesque stays), small uppercase mono labels,
  section indices `/ 01 …`.
- Subtle glow, engineered motion, no glassmorphism rain, no neon floods.

## Section plan (reference order)

| # | Section | Homepage id | Route | Phase |
|---|---------|-------------|-------|-------|
| 01 | Hero (identity + OGL cinema + system status) | `#hero` | — | B |
| 02 | About (statement, pillars, portrait) | `#about` | — | B |
| 03 | Journey (interactive timeline, real facts) | `#journey` | — | B |
| 04 | Featured Work (filter pills, premium cards) | `#work` | `/work/[slug]` | C |
| 05 | Tech Stack (PRODUCT-centered architecture diagram) | `#stack` | — | C |
| 06 | Lab / Playground (6 working experiments) | `#lab` | — | C |
| 07 | Currently Exploring / Now (5 editable cards) | `#now` | — | D |
| 08 | How I Build (scroll-activated process) | `#build` | — | D |
| 09 | More Builds (archive, horizontal on desktop) | `#archive` | — | D |
| 10 | Notes / Blog (DB posts, no fabricated post) | `#notes` | — | E |
| 11 | Uses (DB-driven setup categories) | `#uses` | — | E |
| 12 | Contact (intake form, Zod + rate limit) | `#contact` | — | E |
| 13 | Resume (compact panel, truthful PDF link) | `#resume` | — | E |
| 14 | 404 panel | — | `/404` | F |

## Global systems

- NAV: `KF` monogram + HOME WORK LAB BLOG ABOUT NOW USES SERVICES + CONTACT
  (smooth scroll; items only render when their section exists).
- Cursor language: NORMAL / VIEW / OPEN / PLAY / DRAG; off on touch.
- Ctrl/Cmd + K command palette.
- Dark theme becomes the default (reference is dark); toggle stays.
- Custom 404 per reference panel.

## New DB content

- `projects.category` column (web-app | saas | e-commerce | experiment) for
  filter pills.
- `posts` table + admin (Notes).
- `uses_items` table + admin (Uses).
- `site_settings` keys (resume_pdf, availability, status labels).

## Truthfulness rules (unchanged)

- No fabricated achievements, counts or specs. Metrics must be verifiable real
  numbers (3 products, real build count, real availability).
- Missing facts render as editable placeholders, never fake content.
- Notes/Blog infrastructure ships with real, useful posts only — no fake
  "published" dates.

## Phases

| Phase | Scope | Status |
|-------|-------|--------|
| A | Design foundation: palette retheme, dark default, nav structure, copy, layout metadata | IN PROGRESS |
| B | 01 Hero + 02 About + 03 Journey | |
| C | 04 Work (filters) + 05 Stack diagram + 06 Lab (working experiments) | |
| D | 07 Now + 08 Build + 09 Archive | |
| E | 10 Notes (posts+admin) + 11 Uses (table+admin) + 12 Contact rework + 13 Resume | |
| F | 14 404 + command palette + cursor language + SEO/JSON-LD/sitemap + QA | |

## Verification after each phase

typecheck → lint → build → browser: desktop, mobile (320/375/390/430),
reduced motion, keyboard, overflow.