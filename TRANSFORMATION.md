# TRANSFORMATION — Visual Reference Fidelity

Goal: turn the existing portfolio into the reference dark-cinematic editorial
design. Architecture preserved (Next 16 / React 19 / TS / Tailwind v4 / Neon /
Drizzle / Zod / GSAP / Motion / Lenis / OGL / admin / DB-driven content).

> __Fidelity pass: DONE (recorded below).__ The reference image was shared on
> 2026-10-09 (`WhatsApp Image 2026-10-09 at 2.24.50 AM.jpeg`, 1536×1024). The
> working model cannot view images, so the pass was run quantitatively: the
> JPEG was decoded with sharp and the reference's palette/luminance/layout were
> measured (see "Fidelity measurements" below) and the tokens were matched to
> those numbers.

## Fidelity measurements (decoded from the reference image)

Pixel analysis of the reference (sharp: brightness map, saturated-hue bins,
coarse colour grid, region averages):

| Element | Reference (measured) | Action taken |
|---|---|---|
| Canvas | navy, `#10131a` top → indigo `#1f2242`/`#1c225d` bottom; dominant darks `#04070e`–`#060e18` | ink-950 `#04060b` → `#050a16`; surfaces shifted to `#0a1120`/`#101a30` |
| Atmosphere | strong indigo→violet cast at the bottom edge | static CSS `background-image` on `.dark body` (signal-900/violet-900/pulse-900 radials, fixed attachment) — visible even with motion disabled |
| Headings | pure `#ffffff` | ink-50 `#eceff6` → `#eef1f9` |
| Accent family | blue→indigo→violet→magenta sweep (`#32457f` `#432e8a` `#62388e` `#8f3eac` `#a840ab`) | aurora shader gains a `uAura` uniform = literal `#8f3eac`, layered into the densest field regions |
| Layout | white logo/heading top-left; dark navy everywhere; one mid grey content block; bright CTA bottom-right | already matches (nav + hero top-left, dark cards, white "Let's talk") |

Consequence: because the reference derives its colour identity mostly from the
_atmosphere_ (which the old build only rendered through the JS/WebGL aurora),
a reduced-motion visitor saw a near-black void. The static body atmosphere
fixes that: colours are present with or without motion.

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
| A | Design foundation: palette retheme, dark default, nav structure, copy, layout metadata | DONE — `bbd0141` |
| B | 01 Hero + 02 About + 03 Journey | DONE — `d6eb504` |
| C | 04 Work (filters + categories + admin field) + 05 Stack (`/ 05`, SYS·05) + 06 Lab (6 working experiments) | DONE — `caa5406` |
| D | 07 Now (`#now`, 5 cards) + 08 How I Build (6-step process, scroll-activated) + 09 Archive (horizontal track, 4 real GitHub repos seeded) | DONE — `6c568f7` |
| E | 10 Notes (posts table, admin, `/notes/[slug]`) + 11 Uses (uses_items + admin, 10 verified items seeded) + 12 Contact (`/ 12`, “Let’s build something.”) + 13 Resume (DB-driven, honest mailto fallback) | DONE — `df0f263` |
| F | 14 custom 404 (verified existing) + Ctrl/Cmd+K command palette + cursor language + SEO/JSON-LD/sitemap/robots/security headers (verified existing) + lint/typecheck/build + QA | DONE — `a57da4f` |
| G | Site-level Motion control (kf-motion auto/on/off → `<html data-motion>`, `motion-off` variant, nav toggle + palette commands) + visual fidelity pass from the measured reference (navy canvas `#050a16`, static indigo atmosphere on `.dark body`, whiter text, aurora `uAura` = reference violet `#8f3eac`) | DONE — `27e0abc` |

## Verification after each phase

typecheck → lint → build → browser: desktop, mobile (320/375/390/430),
reduced motion, keyboard, overflow.