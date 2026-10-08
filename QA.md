# QA.md — Manual device verification

This file is the human half of the QA pass. Everything that can be checked in a
headless browser has already been verified at deploy time (structure, routes,
console errors, overflow, DB-driven rendering, asset serving — see commit
history around `79a0415` and after). What **cannot** be verified without a real
browser is anything driven by `requestAnimationFrame` (the GSAP ticker, the
scroll-velocity effect, CSS transform keyframes), so the animated behaviour
below needs one human pass on a real device and a real browser.

## 0. Environment

| Target | What to open |
| --- | --- |
| Desktop | Chrome **or** Safari or Firefox, latest, on macOS/Windows |
| Mobile | iOS Safari **and** Chrome on a real phone (Android), physical touch |
| Reduced motion | DevTools → Rendering → *Emulate `prefers-reduced-motion: reduce`* (Chrome), or enable OS Reduce Motion and reload |

The live URL is always `https://fahim-portfolio-livid.vercel.app` (deploys
automatically from `master`).

## 1. Hero entrance (desktop, animation ON)

Reload the page and watch the first ~2.5s. Expected beat order:

1. **KF monogram** slides in as a full outlined plate behind the name —
   opacity 0 → 1, scale 1.16 → 1, over ~0.85s starting at ~0.07s.
2. **KAZI FAHIM** rises out of it through masked lines (~0.14s in, ~1.15s) —
   the "mark → identity" moment.
3. The **KF plate recedes** to a faint watermark (opacity → 0.1, scale → 0.92)
   while the name finishes rising (~0.95 → 2.45s).
4. Role line and action links resolve last. The whole sequence should feel
   continuous, never strobing or flickering on the KF glyph (its two beats are
   sequential — one writer at a time).

At rest, the KF watermark sits *behind* the name, thin-stroked, unobtrusive.

## 2. Scroll-velocity reaction (desktop)

- Flick the scroll wheel fast: the hero field + grid-lines should shear
  (skewY up to ~2.75°) and scale up slightly (≤1.035) like a camera whip,
  then settle back to rest ~200ms after you stop.
- Scroll slowly/deliberately: near-zero tilt, no wobble or drift.
- Continuous smooth scrolling should feel planted, not spinning.

It reacts to *scroll speed*, not scroll position — nothing should change when
you stop.

## 3. Device matrix

### Mobile — 320, 375, 390, 430 px (physical touch)
- Everything stacks vertically. **No horizontal scroll** anywhere.
- Work panels: full-width cards, video loops run **muted, looping,
  `playsInline`**; no tap-to-unmute expectation.
- "Case study", "Live" (if present) and "Source" (if present) are ≥44px tall
  tap targets; the site never requires hover to reveal info.
- Nav: the sheet (hamburger) shows **all 8 sections 01–08**; on-screen pills
  hide Explore (05) and Playground (06) below `lg` to prevent crowding.
- Contact form submits and the confirmation reads correctly.

### Tablet — 768–1024 px
- Same as mobile for nav pills (05/06 stay hidden until `lg`).
- Stack architecture diagram is fully visible static; tapping/focusing a node
  illuminates connected nodes, dims the rest. Keyboard focus does the same.

### Desktop — ≥1024 px
- Nav pill shows all 8 sections 01–08 with the active one pinned by scroll-spy.
- Selected Work: pinned horizontal track; panels scrub as you scroll; each
  panel's "Case study" pill opens `/work/[slug]`.
- Stack diagram hover shows the connected-graph effect (no flicker).

## 4. Case-study pages (desktop + mobile)

Open `/work/unimate` and `/work/lumina-digital`:

- Header: back link, title, "Live demo" pill (real URL), role/status meter.
- Narrative shows all five steps — **Problem → Solution → Features →
  Implementation → Result** — each rendering its content; anything unwritten
  shows the explicit *TBD* marker (never plausible-sounding filler).
- Media: UniMate plays its silent demo; Lumina displays its screenshot
  (until a real recording is supplied — label reads "interface screenshot").
- Next-case-study card at the bottom wraps to the next project.
- On mobile: no horizontal overflow, sticky step headings collapse to inline.

## 5. Reduced motion (`prefers-reduced-motion: reduce`)

- Hero is **static**: KF watermark visible at its faint resting state, no
  entrance timeline, no velocity reaction, no marquee drift.
- Videos are replaced by their still frame (no bytes fetched).
- Focus/hover reveals (stack diagram, skill rows) still work but without
  transform animation.
- Everything remains readable; no content is hidden by animation-dependent
  transitions.

## 6. Known open items (not QA blockers)

- **Lumina demo video** — when a real recording exists, place it per the
  `/<slug>-demo.mp4` convention and set `video_url` in the admin; the panel
  and case study upgrade their labels automatically.
- Admin password was rotated (local `.env.local` + Vercel secret + DB hash) —
  confirm login works with the new credential.