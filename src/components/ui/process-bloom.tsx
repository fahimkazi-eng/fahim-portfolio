"use client"

import * as React from "react"
import { usePrefersReducedMotion } from "@/components/animations/motion-primitives"

/* ==========================================================================
   ProcessBloom — "How I build", as a scroll-scrubbed sequence.

   One object carries the whole story: a red chrome spider lily, modelled
   procedurally and lit in raw WebGL. Scroll is the timeline. Seven frames —
   the six build stages (Idea → Ship) and a closing call — and between each
   one the camera orbits, the flower shrinks, flies and turns while the frame
   type staggers in behind it.

   The copy is the portfolio's own (`buildStages` / `buildClosing` in
   lib/site.ts). The palette is the site's ink palette and its ember red.

   Motion budget (see MOTION.md). This owns its own rAF loop and writes only
   to its own canvas and its own frame text — it never touches a property any
   page-level animation owns, and it drives no scroll of its own. The loop
   pauses while the section is off-screen and while the tab is hidden, and
   every GL buffer, listener and observer is released on unmount.

   Accessibility. The six stage frames are a kinetic restatement of content
   that also exists as a plain list for assistive tech and for the no-JS case;
   they are hidden from the accessibility tree, and only the closing frame —
   which carries the one real link — stays exposed.
   ========================================================================== */

export type BuildStageCopy = {
  index: string
  label: string
  body: string
}

export type BuildClosingCopy = {
  eyebrow: string
  headline: string
  body: string
  ctaLabel: string
  ctaHref: string
}

export type ProcessBloomProps = {
  /** The process, in order. Six reads best; the camera table covers up to eight. */
  stages: BuildStageCopy[]
  /** The closing frame. Its link points at the real Contact section. */
  closing: BuildClosingCopy
  className?: string
  /** Height of the sticky stage. Must be a definite length. */
  height?: string
  /** Stage-heights of scroll per frame. Sets how long the sequence runs. */
  sceneScroll?: number
  /** Florets in the umbel, 3–8. */
  florets?: number
  /** Changes the flower's shape. */
  seed?: number
  /** Slow idle turn, pointer tilt and petal sway. Reduced motion stops them. */
  alive?: boolean
}

/* ---- palette -------------------------------------------------------------
   Literals, not theme tokens: the WebGL side converts them to linear light,
   and the scene is deliberately theme-independent — a red chrome lily only
   reads on ink, exactly as the opening scene's cosmos does. The values are
   the site's own.

   Note what is *not* here: no background. The stage is transparent on purpose.
   The body paints `--canvas` (the same ink) plus the `.dark body` atmospheric
   wash, and every neighbouring section leaves it showing through — a filled
   rectangle in this one spot would read as a panel laid over the page rather
   than part of it. */
const FG = "#f2f5ff" // --color-ink-50  — primary type
const FG_MUTED = "#949fba" // --color-ink-350 — supporting type
const EMBER = "#ff3b30" // --color-ember   — the site red (same as the intro)

/** The haze's base box, scaled rather than resized so no frame costs a layout. */
const GLOW_BASE = 600

/* ---- type ---------------------------------------------------------------
   The site's three faces, via the same custom properties the global type
   utilities use. `wdth` 92 is the display face's identity setting. */
const DISPLAY: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontWeight: 600,
  fontVariationSettings: '"wdth" 92',
}
const MONO: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "clamp(10px, 1.05cqw, 14px)",
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  lineHeight: 1.3,
}
const SANS: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: "clamp(12.5px, 1.12cqw, 17px)",
  lineHeight: 1.5,
}

/** Big stage words wrap to the container, so the size follows the word. */
const labelSize = (label: string) => {
  const n = label.length
  if (n <= 5) return "min(13cqw, 16cqh)"
  if (n <= 8) return "min(9.6cqw, 13cqh)"
  return "min(7.4cqw, 11cqh)"
}

// #region flower
type V3 = [number, number, number]
type Curve = {
  pts: V3[]
  /** 0 petal ribbon, 1 stamen tube, 2 stem / pedicel */
  kind: 0 | 1 | 2
  /** half-width of a ribbon, radius of a tube */
  w: number
  /** half-thickness of a ribbon */
  t: number
  /** ribbon width direction */
  lat: V3
  twist: number
  bulb: boolean
  phase: number
  stagger: number
  base: V3
}

const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const mul = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s]
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const cross = (a: V3, b: V3): V3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
]
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1
  return [a[0] / l, a[1] / l, a[2] / l]
}

const rng = (seed: number) => {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Where the camera looks: the heart of the umbel, not the receptacle. */
const HEART: V3 = [0, 0.25, 0]

/**
 * The spider lily as centrelines. An umbel of florets on short pedicels, each
 * with six strap-like tepals that sweep out and recurve back past the stem,
 * six long stamens arching up and over like a fountain, one style, and a tall
 * naked scape below. Lycoris radiata, near enough.
 */
const buildCurves = (florets: number, seed: number) => {
  const F = Math.max(3, Math.min(8, Math.round(florets)))
  const r = rng(seed)
  const curves: Curve[] = []
  const up: V3 = [0, 1, 0]

  for (let i = 0; i < F; i++) {
    const phi = (i / F) * Math.PI * 2 + (r() - 0.5) * 0.3
    const tilt = 1.05 + (r() - 0.5) * 0.25
    const radial: V3 = [Math.cos(phi), 0, Math.sin(phi)]
    const u = norm([Math.sin(tilt) * radial[0], Math.cos(tilt), Math.sin(tilt) * radial[2]])
    const base: V3 = [radial[0] * 0.13, 0.07, radial[2] * 0.13]
    const e1 = norm(cross(u, Math.abs(u[1]) > 0.9 ? [1, 0, 0] : up))
    const e2 = cross(u, e1)
    const stagger = i / F
    const common = { base, stagger }

    // pedicel: a short arc from the top of the scape out to the floret
    const ped: V3[] = []
    for (let k = 0; k <= 10; k++) {
      const s = k / 10
      ped.push([radial[0] * 0.13 * s, 0.07 * Math.sin((s * Math.PI) / 2), radial[2] * 0.13 * s])
    }
    curves.push({ pts: ped, kind: 2, w: 0.022, t: 0, lat: e1, twist: 0, bulb: false, phase: 0, ...common })

    for (let j = 0; j < 6; j++) {
      const th = (j / 6) * Math.PI * 2 + i * 0.7 + (r() - 0.5) * 0.35
      const d = add(mul(e1, Math.cos(th)), mul(e2, Math.sin(th)))
      const lat = norm(cross(d, u))
      const phase = r() * Math.PI * 2

      // tepal: the tangent turns from ~30° off the floret axis to ~170°, so the
      // strap leaves the throat, arches wide, and falls back towards the stem
      const L = 1.35 + r() * 0.3
      const b0 = 0.45 + r() * 0.2
      const b1 = 2.75 + r() * 0.45
      const pts: V3[] = [base]
      let p = base
      const steps = 48
      for (let k = 1; k <= steps; k++) {
        const s = k / steps
        const b = b0 + (b1 - b0) * Math.pow(s, 1.2)
        p = add(p, mul(add(mul(d, Math.sin(b)), mul(u, Math.cos(b))), L / steps))
        pts.push(p)
      }
      // the undulating margin, as a lateral wave growing towards the tip
      for (let k = 1; k <= steps; k++) {
        const s = k / steps
        pts[k] = add(pts[k], mul(lat, Math.sin(s * Math.PI * 2.4 + phase) * 0.05 * s))
      }
      curves.push({
        pts, kind: 0, w: 0.075 + r() * 0.02, t: 0.02, lat, twist: 0.2 + r() * 0.35,
        bulb: false, phase, ...common,
      })

      // stamen: up the floret axis, then out and down like a fountain jet
      const d2 = add(mul(e1, Math.cos(th + 0.52)), mul(e2, Math.sin(th + 0.52)))
      const dh = norm([d2[0], 0, d2[2]])
      const start = norm(add(u, mul(d2, 0.25)))
      const end = norm(add(add(mul(radial, 0.85), mul(dh, 0.5)), [0, -0.95, 0]))
      const Ls = 1.75 + r() * 0.45
      const sp: V3[] = [base]
      p = base
      for (let k = 1; k <= 44; k++) {
        const s = k / 44
        const m = Math.pow(s, 1.15)
        p = add(p, mul(norm(add(mul(start, 1 - m), mul(end, m))), Ls / 44))
        sp.push(p)
      }
      curves.push({
        pts: sp, kind: 1, w: 0.012, t: 0, lat, twist: 0, bulb: true,
        phase: phase + 1.3, ...common,
      })
    }

    // style: one per floret, longer and plainer than the stamens
    {
      const end = norm(add(mul(radial, 0.9), [0, -0.35, 0]))
      const sp: V3[] = [base]
      let p = base
      const Ls = 2.2 + r() * 0.3
      for (let k = 1; k <= 44; k++) {
        const s = k / 44
        p = add(p, mul(norm(add(mul(u, 1 - s), mul(end, s))), Ls / 44))
        sp.push(p)
      }
      curves.push({
        pts: sp, kind: 1, w: 0.009, t: 0, lat: e1, twist: 0, bulb: false,
        phase: r() * 6, ...common,
      })
    }
  }

  // the scape: tall, leafless, faintly bowed
  const stem: V3[] = []
  for (let k = 0; k <= 40; k++) {
    const s = k / 40
    const y = 0.04 - s * 4.6
    stem.push([Math.sin(s * 2.2) * 0.07, y, Math.sin(s * 1.3) * 0.03])
  }
  curves.push({
    pts: stem, kind: 2, w: 0.05, t: 0, lat: [1, 0, 0], twist: 0, bulb: false,
    phase: 0, stagger: 0, base: [0, 0, 0],
  })

  let radius = 0
  for (const c of curves) {
    if (c.kind === 2) continue
    for (const q of c.pts) radius = Math.max(radius, Math.hypot(q[0] - HEART[0], q[1] - HEART[1], q[2] - HEART[2]))
  }
  return { curves, radius }
}

/** Interleaved vertex layout: pos 3, normal 3, aux 4 (s, phase, kind, stagger), base 3. */
const STRIDE = 13

const buildMesh = (curves: Curve[]) => {
  const v: number[] = []
  const idx: number[] = []
  let count = 0
  const push = (p: V3, n: V3, s: number, c: Curve) => {
    v.push(p[0], p[1], p[2], n[0], n[1], n[2], s, c.phase, c.kind, c.stagger, c.base[0], c.base[1], c.base[2])
    return count++
  }
  const tangent = (pts: V3[], i: number) =>
    norm(sub(pts[Math.min(i + 1, pts.length - 1)], pts[Math.max(i - 1, 0)]))

  for (const c of curves) {
    const n = c.pts.length
    if (c.kind === 0) {
      // A flat strap with real thickness: four faces, hard-edged, so the
      // chrome picks up a bright line along each rim like a pressed band.
      const rings: number[][] = []
      let first: V3[] = []
      let last: V3[] = []
      let T0: V3 = [0, 1, 0]
      let T1: V3 = [0, 1, 0]
      for (let i = 0; i < n; i++) {
        const s = i / (n - 1)
        const T = tangent(c.pts, i)
        let N = norm(cross(T, c.lat))
        let W = cross(N, T)
        const a = c.twist * Math.sin(Math.PI * s)
        const ca = Math.cos(a)
        const sa = Math.sin(a)
        const W2 = add(mul(W, ca), mul(N, sa))
        N = sub(mul(N, ca), mul(W, sa))
        W = W2
        const hw = c.w * (0.42 + 0.58 * Math.pow(Math.sin(Math.PI * Math.min(1, 0.12 + s * 0.9)), 0.6))
          * (1 + 0.1 * Math.sin(s * 34 + c.phase))
        const p = c.pts[i]
        const k0 = add(add(p, mul(W, hw)), mul(N, c.t))
        const k1 = add(sub(p, mul(W, hw)), mul(N, c.t))
        const k2 = sub(sub(p, mul(W, hw)), mul(N, c.t))
        const k3 = sub(add(p, mul(W, hw)), mul(N, c.t))
        const mW = mul(W, -1)
        const mN = mul(N, -1)
        rings.push([
          push(k0, N, s, c), push(k1, N, s, c),
          push(k1, mW, s, c), push(k2, mW, s, c),
          push(k2, mN, s, c), push(k3, mN, s, c),
          push(k3, W, s, c), push(k0, W, s, c),
        ])
        if (i === 0) { first = [k0, k1, k2, k3]; T0 = T }
        if (i === n - 1) { last = [k0, k1, k2, k3]; T1 = T }
      }
      for (let i = 0; i < n - 1; i++) {
        const a = rings[i]
        const b = rings[i + 1]
        for (let f = 0; f < 4; f++) {
          const x = f * 2
          idx.push(a[x], a[x + 1], b[x], a[x + 1], b[x + 1], b[x])
        }
      }
      const cap = (q: V3[], nrm: V3, s: number) => {
        const o = q.map((p) => push(p, nrm, s, c))
        idx.push(o[0], o[1], o[2], o[0], o[2], o[3])
      }
      cap(first, mul(T0, -1), 0)
      cap(last, T1, 1)
    } else {
      // Round tube on a parallel-transport frame, so it never corkscrews.
      const seg = c.kind === 2 ? 10 : 6
      let N = norm(cross(tangent(c.pts, 0), c.kind === 2 ? [0, 0, 1] : c.lat))
      const rings: number[] = []
      for (let i = 0; i < n; i++) {
        const s = i / (n - 1)
        const T = tangent(c.pts, i)
        N = norm(sub(N, mul(T, dot(N, T))))
        const B = cross(T, N)
        let rad = c.w * (c.kind === 1 ? 1 - 0.35 * s : 1)
        if (c.bulb && s > 0.9) rad = c.w * (0.65 + 2.1 * Math.sin(((s - 0.9) / 0.1) * Math.PI * 0.92))
        if (c.kind === 1 && i === n - 1) rad *= 0.3
        rings.push(count)
        for (let k = 0; k <= seg; k++) {
          const a = (k / seg) * Math.PI * 2
          const nr = add(mul(N, Math.cos(a)), mul(B, Math.sin(a)))
          push(add(c.pts[i], mul(nr, rad)), nr, s, c)
        }
      }
      for (let i = 0; i < n - 1; i++) {
        for (let k = 0; k < seg; k++) {
          const a = rings[i] + k
          const b = rings[i + 1] + k
          idx.push(a, a + 1, b, a + 1, b + 1, b)
        }
      }
    }
  }
  return { data: new Float32Array(v), index: new Uint16Array(idx), vertices: count }
}
// #endregion

// #region scroll
const clamp01 = (x: number) => (x <= 0 ? 0 : x > 1 ? 1 : x)
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/** 0 while the root's top sits at the stage's top, 1 when its bottom does. */
const progressFrom = (top: number, height: number, viewport: number) => {
  const travel = height - viewport
  if (travel <= 0) return 0
  return clamp01(-top / travel)
}

/**
 * Scroll progress → a continuous frame coordinate in 0..n-1. Integers are the
 * frames; each one holds for `hold` of its slot so the copy can be read before
 * the next morph starts.
 */
const sceneCoord = (p: number, n: number, hold: number) => {
  if (n <= 1) return 0
  const t = clamp01(p) * (n - 1)
  const i = Math.min(Math.floor(t), n - 2)
  const h = hold / 2
  return i + easeInOut(clamp01((t - i - h) / (1 - 2 * h)))
}

/**
 * How present one element of frame `scene` is at `coord`. `delay` 0..1 staggers
 * it: late on the way in, and — mirrored — late on the way out.
 */
const reveal = (coord: number, scene: number, delay: number) => {
  const d = coord - scene
  const lag = d < 0 ? delay : 1 - delay
  return clamp01((0.6 - Math.abs(d) - lag * 0.2) / 0.25)
}
// #endregion

// ---- camera frames -------------------------------------------------------

type Key = {
  /** turn of the flower about its stem, radians */
  spin: number
  /** camera elevation, degrees; +90 looks straight down */
  el: number
  /** flower radius as a fraction of the stage's short side */
  size: number
  /** where the heart lands, in clip space (-1..1, +y up) */
  ox: number
  oy: number
  /** how much of the scape is drawn; below the flower it is in the way */
  stem: number
}

/* One key per stage, plus the closing. Each is composed so the flower lands
   clear of that frame's copy. */
const STAGE_KEYS: Key[] = [
  { spin: 0.2, el: 9, size: 0.86, ox: 0.0, oy: 0.32, stem: 1.0 },
  { spin: 1.4, el: 88, size: 0.56, ox: 0.0, oy: 0.04, stem: 0.0 },
  { spin: 2.3, el: 12, size: 0.26, ox: 0.0, oy: 0.14, stem: 0.3 },
  { spin: 3.1, el: -30, size: 0.88, ox: 0.0, oy: -0.36, stem: 0.06 },
  { spin: 4.1, el: 16, size: 1.0, ox: 0.62, oy: 0.18, stem: 1.0 },
  { spin: 4.8, el: -14, size: 0.8, ox: 0.0, oy: 0.88, stem: 0.4 },
]
const CLOSING_KEY: Key = { spin: 5.7, el: 10, size: 0.6, ox: 0.0, oy: 0.46, stem: 1.0 }

/* Portrait stages move the flower rather than squeezing the type. */
const STAGE_TALL: Partial<Key>[] = [
  { size: 0.72, oy: 0.5 },
  { size: 0.46, ox: 0.34, oy: 0.06 },
  { size: 0.3, oy: 0.16 },
  { size: 0.78, oy: -0.44 },
  { size: 0.68, ox: 0.0, oy: 0.46 },
  { size: 0.74, oy: 0.58 },
]
const CLOSING_TALL: Partial<Key> = { size: 0.54, oy: 0.52 }

const HOLD = 0.34

const keyFor = (scene: number, tall: boolean, stageCount: number): Key => {
  const base = scene >= stageCount ? CLOSING_KEY : STAGE_KEYS[Math.min(scene, STAGE_KEYS.length - 1)]
  const over = scene >= stageCount ? CLOSING_TALL : STAGE_TALL[Math.min(scene, STAGE_TALL.length - 1)]
  return { ...base, ...(tall ? over : {}) }
}

const keyAt = (coord: number, tall: boolean, stageCount: number): Key => {
  const last = stageCount
  const i = Math.max(0, Math.min(last, Math.floor(coord)))
  const j = Math.min(last, i + 1)
  const f = coord - i
  const a = keyFor(i, tall, stageCount)
  const b = keyFor(j, tall, stageCount)
  const l = (x: number, y: number) => x + (y - x) * f
  return {
    spin: l(a.spin, b.spin), el: l(a.el, b.el), size: l(a.size, b.size),
    ox: l(a.ox, b.ox), oy: l(a.oy, b.oy), stem: l(a.stem, b.stem),
  }
}

// ---- matrices (column-major) ----------------------------------------------

type M4 = Float32Array
const perspective = (fovy: number, aspect: number, near: number, far: number): M4 => {
  const f = 1 / Math.tan(fovy / 2)
  const m = new Float32Array(16)
  m[0] = f / aspect
  m[5] = f
  m[10] = (far + near) / (near - far)
  m[11] = -1
  m[14] = (2 * far * near) / (near - far)
  return m
}
const lookAt = (eye: V3, at: V3): M4 => {
  const z = norm(sub(eye, at))
  const x = norm(cross([0, 1, 0], z))
  const y = cross(z, x)
  const m = new Float32Array(16)
  m[0] = x[0]; m[4] = x[1]; m[8] = x[2]
  m[1] = y[0]; m[5] = y[1]; m[9] = y[2]
  m[2] = z[0]; m[6] = z[1]; m[10] = z[2]
  m[12] = -dot(x, eye); m[13] = -dot(y, eye); m[14] = -dot(z, eye); m[15] = 1
  return m
}
const multiply = (a: M4, b: M4): M4 => {
  const o = new Float32Array(16)
  for (let c = 0; c < 4; c++)
    for (let r = 0; r < 4; r++)
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3]
  return o
}
const rotY = (t: number): M4 => {
  const c = Math.cos(t)
  const s = Math.sin(t)
  return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1])
}
const rotX = (t: number): M4 => {
  const c = Math.cos(t)
  const s = Math.sin(t)
  return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1])
}

const hexToLinear = (hex: string): V3 => {
  let h = hex.replace("#", "").trim()
  if (h.length === 3) h = h.split("").map((c) => c + c).join("")
  const n = parseInt(h.slice(0, 6), 16)
  if (Number.isNaN(n)) return [0.8, 0.02, 0.03]
  const ch = (v: number) => Math.pow(v / 255, 2.2)
  return [ch((n >> 16) & 255), ch((n >> 8) & 255), ch(n & 255)]
}

// ---- shaders --------------------------------------------------------------

const VERT = `
attribute vec3 a_pos;
attribute vec3 a_nrm;
attribute vec4 a_aux;
attribute vec3 a_base;
uniform mat4 u_vp;
uniform mat4 u_model;
uniform vec2 u_offset;
uniform float u_time;
uniform float u_bloom;
uniform float u_sway;
uniform float u_stem;
varying vec3 v_n;
varying vec3 v_w;
varying float v_s;
void main() {
  vec3 p = a_pos;
  float k = a_aux.z;
  if (k < 1.5) {
    float g = clamp(u_bloom * 1.6 - a_aux.w * 0.6, 0.0, 1.0);
    g = 1.0 - pow(1.0 - g, 3.0);
    p = a_base + (p - a_base) * g;
    float amp = (k < 0.5 ? 0.03 : 0.06) * u_sway * a_aux.x * a_aux.x;
    p += amp * vec3(sin(u_time * 0.9 + a_aux.y), 0.5 * sin(u_time * 1.3 + a_aux.y * 1.7), cos(u_time * 0.7 + a_aux.y * 1.3));
  } else if (p.y < 0.0) {
    p.y *= u_stem;
  }
  vec4 w = u_model * vec4(p, 1.0);
  v_w = w.xyz;
  v_n = (u_model * vec4(a_nrm, 0.0)).xyz;
  v_s = a_aux.x;
  gl_Position = u_vp * w;
  gl_Position.xy += u_offset * gl_Position.w;
}
`

// Red chrome: almost no diffuse, everything is the reflection of a dark studio
// with one overhead softbox, a tall side strip and a back rim — tinted crimson,
// running to pink-white only where the highlight is hottest.
const FRAG = `
precision highp float;
uniform vec3 u_eye;
uniform vec3 u_red;
uniform vec3 u_hot;
uniform float u_alpha;
varying vec3 v_n;
varying vec3 v_w;
varying float v_s;
float studio(vec3 r) {
  float key = pow(max(dot(r, normalize(vec3(-0.45, 0.85, 0.35))), 0.0), 14.0) * 2.6;
  float strip = smoothstep(0.55, 0.8, r.x) * smoothstep(-0.7, 0.3, r.y) * 1.4;
  float rim = smoothstep(0.55, 0.95, -r.z) * smoothstep(-0.2, 0.5, r.y) * 0.9;
  float hz = exp(-abs(r.y - 0.05) * 7.0) * 0.4;
  return key + strip + rim + hz;
}
void main() {
  vec3 n = normalize(v_n);
  vec3 v = normalize(u_eye - v_w);
  if (dot(n, v) < 0.0) n = -n;
  vec3 r = reflect(-v, n);
  float e = studio(r);
  float fr = pow(1.0 - max(dot(n, v), 0.0), 3.0);
  float dif = max(dot(n, normalize(vec3(-0.3, 0.8, 0.6))), 0.0);
  vec3 col = u_red * (0.04 + 0.22 * dif);
  col += u_red * e * 1.15;
  col += u_hot * pow(e, 3.0) * 0.3;
  col += u_red * fr * 1.1;
  col *= 0.8 + 0.2 * smoothstep(0.0, 0.25, v_s);
  col = col / (1.0 + col);
  col = pow(col, vec3(1.0 / 2.2));
  gl_FragColor = vec4(col * u_alpha, u_alpha);
}
`

// ---- scoped css ----------------------------------------------------------
// Prefixed `pb-`. Container queries do the layout work: the stage is the query
// container, and each frame reacts to its own aspect rather than the viewport's.
const CSS =
  ".pb-stage{container-type:size;container-name:pb}" +
  ".pb-rail{display:flex;flex-direction:column;align-items:flex-end;gap:11px;list-style:none;margin:0;padding:0}" +
  ".pb-rail i{display:block;width:14px;height:1px;background:" + FG + ";opacity:.26;transition:width .45s cubic-bezier(.2,.8,.2,1),background-color .3s,opacity .3s}" +
  ".pb-rail i[data-on]{width:34px;opacity:1;background:" + EMBER + "}" +
  ".pb-cta{position:relative}" +
  ".pb-cta::after{content:'';position:absolute;left:0;right:0;bottom:-0.35em;height:1px;background:" + EMBER + ";transform:scaleX(0);transform-origin:left;transition:transform .4s cubic-bezier(.2,.8,.2,1)}" +
  ".pb-cta:hover::after,.pb-cta:focus-visible::after{transform:scaleX(1)}" +
  "@container pb (orientation: portrait){" +
  ".pb-split{top:auto!important;bottom:9cqh!important;transform:none!important}" +
  "}" +
  "@container pb (max-width: 860px){.pb-hide-sm{display:none!important}}" +
  "@container pb (max-width: 1180px){.pb-hide-md{display:none!important}}" +
  "@media (prefers-reduced-motion: reduce){.pb-rail i{transition:none}}"

/* No JS: the canvas and the sticky stage can never animate, so drop them and
   let the plain stage list stand in as ordinary content. */
const NOSCRIPT =
  "[data-pb-root]{height:auto !important}" +
  "[data-pb-stage]{display:none !important}" +
  "[data-pb-sr]{position:static !important;width:auto !important;height:auto !important;margin:0 !important;padding:0 !important;overflow:visible !important;clip:auto !important;white-space:normal !important}"

type Fx = "rise" | "clip" | "line" | "fade" | "draw"

/** Everything that belongs to one frame registers itself through this. */
const sc = (scene: number, fx: Fx = "rise", delay = 0) => ({
  "data-sc": scene,
  "data-fx": fx,
  "data-d": delay,
})

const HIDDEN: React.CSSProperties = { opacity: 0 }

/** A definite placement for a frame layer. */
const at = (p: React.CSSProperties): React.CSSProperties => ({ position: "absolute", ...p })

/**
 * A stage word, one span per character so the letters stagger in as the frame
 * arrives. Pure and module-scope so React never remounts the subtree.
 */
function Word({ text, scene, delay = 0.12 }: { text: string; scene: number; delay?: number }) {
  return (
    <>
      {Array.from(text).map((c, i) => (
        <span
          key={`${c}-${i}`}
          {...sc(scene, "rise", Math.min(0.94, delay + i * 0.055))}
          style={{ ...HIDDEN, display: "inline-block", whiteSpace: "pre" }}
        >
          {c}
        </span>
      ))}
    </>
  )
}

type Variant = "cover" | "head" | "foot" | "diag" | "split" | "center"

/**
 * One stage frame. The six variants place the same three facts — index, label,
 * body — in different regions so the sequence reads as composed frames rather
 * than one layout repeated six times.
 */
function StageFrame({
  stage,
  scene,
  total,
  variant,
}: {
  stage: BuildStageCopy
  scene: number
  total: string
  variant: Variant
}) {
  const num = (
    <span {...sc(scene, "rise", 0)} style={{ ...MONO, color: EMBER }}>
      {stage.index}
      <span style={{ color: FG_MUTED }}> / {total}</span>
    </span>
  )
  const label = (
    <span
      style={{
        ...DISPLAY,
        display: "block",
        fontSize: labelSize(stage.label),
        lineHeight: 0.88,
        letterSpacing: "-0.02em",
        textTransform: "uppercase",
        color: FG,
      }}
    >
      <Word text={stage.label} scene={scene} />
    </span>
  )
  const body = (
    <p
      {...sc(scene, "rise", 0.42)}
      style={{ ...HIDDEN, ...SANS, margin: 0, maxWidth: "32ch", color: FG_MUTED }}
    >
      {stage.body}
    </p>
  )
  const rule = (
    <span
      {...sc(scene, "line", 0.3)}
      style={{ ...HIDDEN, display: "block", height: 1, width: "100%", background: FG + "26", transformOrigin: "left" }}
    />
  )

  switch (variant) {
    case "head":
      return (
        <>
          <div style={at({ left: "5cqw", top: "12cqh" })}>{num}</div>
          <div style={at({ left: "5cqw", top: "17cqh", maxWidth: "74cqw" })}>{label}</div>
          <div style={at({ left: "5cqw", bottom: "9cqh", maxWidth: "36cqw" })}>{body}</div>
        </>
      )
    case "foot":
      return (
        <>
          <div style={at({ left: "5cqw", top: "12cqh" })}>{num}</div>
          <div style={at({ left: "5cqw", bottom: "9cqh", maxWidth: "70cqw" })}>{label}</div>
          <div style={at({ right: "5cqw", top: "13cqh", maxWidth: "30cqw", textAlign: "right" })}>{body}</div>
        </>
      )
    case "diag":
      return (
        <>
          <div style={at({ left: "5cqw", top: "12cqh" })}>{num}</div>
          <div style={at({ left: "5cqw", top: "17cqh", maxWidth: "60cqw" })}>{label}</div>
          <div style={at({ right: "5cqw", top: "13cqh", maxWidth: "30cqw", textAlign: "right" })}>{body}</div>
        </>
      )
    case "split":
      return (
        <div
          className="pb-split"
          style={at({ left: "5cqw", top: "50cqh", transform: "translateY(-50%)", maxWidth: "38cqw" })}
        >
          <div style={{ marginBottom: "3cqh" }}>{num}</div>
          {label}
          <div style={{ marginTop: "4cqh", maxWidth: "32ch" }}>{body}</div>
        </div>
      )
    case "center":
      return (
        <div style={at({ left: "10cqw", right: "10cqw", bottom: "9cqh", textAlign: "center" })}>
          <div style={{ display: "flex", justifyContent: "center" }}>{num}</div>
          <div style={{ marginTop: "2.5cqh" }}>{label}</div>
          <div style={{ display: "flex", justifyContent: "center", marginTop: "3.5cqh" }}>{body}</div>
        </div>
      )
    default:
      return (
        <>
          <div style={at({ left: "5cqw", top: "12cqh" })}>{num}</div>
          <div style={at({ left: "5cqw", bottom: "9cqh", maxWidth: "70cqw" })}>{label}</div>
          <div style={at({ left: "5cqw", bottom: "22cqh", width: "26cqw" })} className="pb-hide-sm">{rule}</div>
          <div style={at({ right: "5cqw", bottom: "9cqh", maxWidth: "30cqw", textAlign: "right" })}>{body}</div>
        </>
      )
  }
}

const VARIANTS: Variant[] = ["cover", "head", "foot", "diag", "split", "center"]

export function ProcessBloom({
  stages,
  closing,
  className = "",
  height = "100svh",
  sceneScroll = 0.9,
  florets = 6,
  seed = 7,
  alive = true,
}: ProcessBloomProps) {
  const rootRef = React.useRef<HTMLElement | null>(null)
  const stageRef = React.useRef<HTMLDivElement | null>(null)
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const glowRef = React.useRef<HTMLDivElement | null>(null)
  const [active, setActive] = React.useState(0)

  const reduced = usePrefersReducedMotion()

  /* The rAF loop reads the latest flags off this ref. It is written in an
     effect rather than during render: mutating a ref while rendering is a
     side effect, and the loop only ever reads it asynchronously. */
  const look = React.useRef({ alive, reduced })
  React.useEffect(() => {
    look.current = { alive, reduced }
  })

  const stageCount = stages.length
  const sceneCount = stageCount + 1
  const total = String(stageCount).padStart(2, "0")

  React.useEffect(() => {
    const root = rootRef.current
    const stage = stageRef.current
    const canvas = canvasRef.current
    const glow = glowRef.current
    if (!root || !stage || !canvas || !glow) return

    const { curves, radius } = buildCurves(florets, seed)
    const mesh = buildMesh(curves)

    // ---- GL, with a 2D fallback -------------------------------------------
    let gl: WebGLRenderingContext | null = null
    let ctx2d: CanvasRenderingContext2D | null = null
    let prog: WebGLProgram | null = null
    let vbo: WebGLBuffer | null = null
    let ibo: WebGLBuffer | null = null
    const loc: Record<string, WebGLUniformLocation | null> = {}

    const initGL = () => {
      gl = canvas.getContext("webgl", { alpha: true, antialias: true, premultipliedAlpha: true }) as WebGLRenderingContext | null
      if (!gl) return false
      const compile = (type: number, src: string) => {
        const sh = gl!.createShader(type)!
        gl!.shaderSource(sh, src)
        gl!.compileShader(sh)
        return gl!.getShaderParameter(sh, gl!.COMPILE_STATUS) ? sh : null
      }
      const vs = compile(gl.VERTEX_SHADER, VERT)
      const fs = compile(gl.FRAGMENT_SHADER, FRAG)
      if (!vs || !fs) return false
      prog = gl.createProgram()!
      gl.attachShader(prog, vs)
      gl.attachShader(prog, fs)
      gl.linkProgram(prog)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false
      gl.useProgram(prog)
      vbo = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
      gl.bufferData(gl.ARRAY_BUFFER, mesh.data, gl.STATIC_DRAW)
      ibo = gl.createBuffer()
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo)
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.index, gl.STATIC_DRAW)
      const attr = (n: string, size: number, off: number) => {
        const a = gl!.getAttribLocation(prog!, n)
        if (a < 0) return
        gl!.enableVertexAttribArray(a)
        gl!.vertexAttribPointer(a, size, gl!.FLOAT, false, STRIDE * 4, off * 4)
      }
      attr("a_pos", 3, 0)
      attr("a_nrm", 3, 3)
      attr("a_aux", 4, 6)
      attr("a_base", 3, 10)
      for (const n of ["u_vp", "u_model", "u_offset", "u_time", "u_bloom", "u_sway", "u_stem", "u_eye", "u_red", "u_hot", "u_alpha"])
        loc[n] = gl.getUniformLocation(prog, n)
      gl.enable(gl.DEPTH_TEST)
      gl.clearColor(0, 0, 0, 0)
      return true
    }
    if (!initGL()) {
      gl = null
      ctx2d = canvas.getContext("2d")
    }
    const onLost = (e: Event) => {
      e.preventDefault()
      gl = null
    }
    const onRestored = () => {
      if (!initGL()) gl = null
    }
    canvas.addEventListener("webglcontextlost", onLost)
    canvas.addEventListener("webglcontextrestored", onRestored)

    // ---- measuring ---------------------------------------------------------
    let W = 1
    let H = 1
    let dpr = 1
    const measure = () => {
      const sr = stage.getBoundingClientRect()
      W = Math.max(1, sr.width)
      H = Math.max(1, sr.height)
      dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      const cw = Math.round(W * dpr)
      const ch = Math.round(H * dpr)
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw
        canvas.height = ch
      }
    }
    const ro = new ResizeObserver(measure)
    ro.observe(stage)
    measure()

    // ---- frame elements -----------------------------------------------------
    const items = Array.from(stage.querySelectorAll<HTMLElement>("[data-sc]")).map((el) => ({
      el,
      scene: Number(el.dataset.sc),
      fx: el.dataset.fx as Fx,
      delay: Number(el.dataset.d) || 0,
      last: -1,
    }))

    // ---- input ----------------------------------------------------------------
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 }
    let spin = 0
    let spinVel = 0
    let drag: { id: number; x: number } | null = null
    const onMove = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect()
      pointer.tx = ((e.clientX - r.left) / r.width) * 2 - 1
      pointer.ty = ((e.clientY - r.top) / r.height) * 2 - 1
      if (drag && drag.id === e.pointerId) {
        spinVel += (e.clientX - drag.x) * 0.0022
        drag.x = e.clientX
      }
    }
    /* Drag-to-turn is mouse-only: touch keeps the page's vertical scroll. */
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return
      const t = e.target as HTMLElement
      if (t.closest("a,button")) return
      drag = { id: e.pointerId, x: e.clientX }
      stage.style.cursor = "grabbing"
    }
    const onUp = () => {
      drag = null
      stage.style.cursor = ""
    }
    stage.addEventListener("pointermove", onMove)
    stage.addEventListener("pointerdown", onDown)
    window.addEventListener("pointerup", onUp)

    // ---- loop -------------------------------------------------------------------
    let raf = 0
    let running = false
    let last = performance.now()
    /* The bloom plays the first time the section is actually on screen, not on
       page load — otherwise it would be over before the visitor arrives. */
    let born = last
    let hasArrived = false
    let time = 0
    let prog01 = -1
    let shownScene = -1
    let lastGlow = ""

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const L = look.current
      const moving = L.alive && !L.reduced
      if (moving) time += dt

      const r = root.getBoundingClientRect()
      /* Off the viewport the canvas is not composited, so there is no frame to
         keep alive. Park the loop here and let a scroll or resize wake it
         again — without this it goes on drawing for the rest of the page. */
      if (r.bottom < -240 || r.top > H + 240) {
        stop()
        return
      }
      if (!hasArrived) {
        hasArrived = true
        born = now
      }
      const p = progressFrom(r.top, r.height, H)
      // Follow the scroll closely. Lenis already smooths the wheel, so a second
      // slow filter here only reads as the whole scene trailing the page.
      prog01 = prog01 < 0 || L.reduced ? p : prog01 + (p - prog01) * (1 - Math.exp(-dt * 12))
      const coord = sceneCoord(prog01, sceneCount, HOLD)
      const scene = Math.round(coord)
      if (scene !== shownScene) {
        shownScene = scene
        setActive(scene)
      }

      // camera
      const tall = H > W * 1.05
      const k = keyAt(coord, tall, stageCount)
      pointer.x += (pointer.tx - pointer.x) * (1 - Math.exp(-dt * 4))
      pointer.y += (pointer.ty - pointer.y) * (1 - Math.exp(-dt * 4))
      if (moving) {
        spin += spinVel + dt * 0.1
        spinVel *= Math.exp(-dt * 3)
      } else {
        spin += spinVel
        spinVel = 0
      }
      const px = moving ? pointer.x : 0
      const py = moving ? pointer.y : 0
      const fov = (30 * Math.PI) / 180
      const minDim = Math.min(W, H)
      const dist = (radius * H) / (k.size * minDim * Math.tan(fov / 2))
      const el = Math.max(-88, Math.min(88, k.el + py * 9)) * (Math.PI / 180)
      const eye: V3 = [HEART[0], HEART[1] + Math.sin(el) * dist, HEART[2] + Math.cos(el) * dist]
      const proj = perspective(fov, W / H, Math.max(0.05, dist - 6), dist + 8)
      const vp = multiply(proj, lookAt(eye, HEART))
      const model = multiply(rotY(k.spin + spin + px * 0.35), rotX(py * 0.05))
      const bloom = L.reduced ? 1 : clamp01((now - born) / 2600)

      // the red haze behind the flower tracks where the heart lands. Position
      // and scale only: the element has a fixed box, so a frame never triggers
      // layout or a repaint of the gradient — the compositor moves it.
      const gx = (0.5 + k.ox / 2) * W
      const gy = (0.5 - k.oy / 2) * H
      const gr = k.size * minDim * 1.25
      const gt =
        "translate(" + (gx - gr).toFixed(1) + "px," + (gy - gr).toFixed(1) + "px) scale(" +
        ((gr * 2) / GLOW_BASE).toFixed(4) + ")"
      if (gt !== lastGlow) {
        lastGlow = gt
        glow.style.transform = gt
      }

      if (gl && prog) {
        const g = gl
        g.viewport(0, 0, canvas.width, canvas.height)
        g.clear(g.COLOR_BUFFER_BIT | g.DEPTH_BUFFER_BIT)
        const red = hexToLinear(EMBER)
        g.uniformMatrix4fv(loc.u_vp, false, vp)
        g.uniformMatrix4fv(loc.u_model, false, model)
        g.uniform2f(loc.u_offset, k.ox, k.oy)
        g.uniform1f(loc.u_time, time)
        g.uniform1f(loc.u_bloom, bloom)
        g.uniform1f(loc.u_sway, moving ? 1 : 0)
        g.uniform1f(loc.u_stem, k.stem)
        g.uniform3f(loc.u_eye, eye[0], eye[1], eye[2])
        g.uniform3f(loc.u_red, red[0] * 2.2, red[1] * 2.2, red[2] * 2.2)
        g.uniform3f(loc.u_hot, 1, 0.55 + red[1], 0.5 + red[2])
        g.uniform1f(loc.u_alpha, 1)
        g.drawElements(g.TRIANGLES, mesh.index.length, g.UNSIGNED_SHORT, 0)
      } else if (ctx2d) {
        // No WebGL: the same curves, projected and stroked.
        const c = ctx2d
        const mvp = multiply(vp, model)
        c.setTransform(dpr, 0, 0, dpr, 0, 0)
        c.clearRect(0, 0, W, H)
        c.lineCap = "round"
        c.strokeStyle = EMBER
        c.shadowColor = EMBER
        c.shadowBlur = 12
        for (const cv of curves) {
          c.beginPath()
          cv.pts.forEach((q, i) => {
            const y = cv.kind === 2 && q[1] < 0 ? q[1] * k.stem : q[1]
            const cx = mvp[0] * q[0] + mvp[4] * y + mvp[8] * q[2] + mvp[12]
            const cy = mvp[1] * q[0] + mvp[5] * y + mvp[9] * q[2] + mvp[13]
            const cw = mvp[3] * q[0] + mvp[7] * y + mvp[11] * q[2] + mvp[15]
            const sx = ((cx / cw + k.ox) * 0.5 + 0.5) * W
            const sy = (0.5 - (cy / cw + k.oy) * 0.5) * H
            if (i === 0) c.moveTo(sx, sy)
            else c.lineTo(sx, sy)
          })
          c.lineWidth = cv.kind === 0 ? (minDim * k.size) / 22 : cv.kind === 1 ? 1.2 : 3
          c.stroke()
        }
      }

      // ---- the type ---------------------------------------------------------
      const still = L.reduced
      for (const it of items) {
        const v = reveal(coord, it.scene, it.delay)
        const q = Math.round(v * 500) / 500
        if (q === it.last) continue
        it.last = q
        const s = it.el.style
        const dir = coord < it.scene ? 1 : -1
        s.visibility = q <= 0 ? "hidden" : ""
        if (it.fx === "draw") {
          s.setProperty("--v", String(q))
          s.opacity = String(Math.min(1, q * 3))
          continue
        }
        if (it.fx === "line") {
          s.transform = "scaleX(" + q + ")"
          s.opacity = String(Math.min(1, q * 2))
          continue
        }
        s.opacity = String(q)
        if (still || it.fx === "fade") continue
        if (it.fx === "clip") {
          const hid = ((1 - q) * 100).toFixed(1)
          s.clipPath = dir > 0 ? "inset(0 0 " + hid + "% 0)" : "inset(" + hid + "% 0 0 0)"
          s.transform = "translateY(" + ((1 - q) * 0.4 * dir).toFixed(3) + "em)"
        } else {
          s.transform = "translateY(" + ((1 - q) * 34 * dir).toFixed(1) + "px)"
        }
      }
    }

    const start = () => {
      if (running || document.hidden) return
      running = true
      last = performance.now()
      raf = requestAnimationFrame(frame)
    }
    const stop = () => {
      running = false
      cancelAnimationFrame(raf)
    }
    /* The loop parks itself the moment the stage leaves the viewport (see
       `frame`), so every way back into view has to re-arm it. `start` is
       idempotent, so firing on scroll is cheap. */
    const wake = () => start()
    const onVis = () => (document.hidden ? stop() : start())
    document.addEventListener("visibilitychange", onVis)
    window.addEventListener("scroll", wake, { passive: true })
    window.addEventListener("resize", wake)
    window.addEventListener("focus", wake)
    window.addEventListener("pageshow", wake)
    start()

    return () => {
      stop()
      ro.disconnect()
      document.removeEventListener("visibilitychange", onVis)
      window.removeEventListener("scroll", wake)
      window.removeEventListener("resize", wake)
      window.removeEventListener("focus", wake)
      window.removeEventListener("pageshow", wake)
      stage.removeEventListener("pointermove", onMove)
      stage.removeEventListener("pointerdown", onDown)
      window.removeEventListener("pointerup", onUp)
      canvas.removeEventListener("webglcontextlost", onLost)
      canvas.removeEventListener("webglcontextrestored", onRestored)
      const g = gl as WebGLRenderingContext | null
      if (g) {
        g.deleteBuffer(vbo)
        g.deleteBuffer(ibo)
        g.deleteProgram(prog)
      }
    }
    // `florets`, `seed`, `alive` and `reduced` are read through `look`; the
    // geometry is built once and `stageCount` is a stable number.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageCount])

  return (
    <section
      ref={rootRef}
      data-pb-root
      className={"relative w-full " + className}
      style={{
        height: "calc(" + height + " * " + (1 + (sceneCount - 1) * sceneScroll).toFixed(3) + ")",
      }}
      aria-label="How I build"
    >
      <style>{CSS}</style>
      <noscript>
        <style>{NOSCRIPT}</style>
      </noscript>

      {/* The scroll-independent form of the process. The frames below are its
          kinetic restatement, and are hidden from assistive tech. */}
      <div data-pb-sr className="sr-only">
        <h3>How I build, in six stages</h3>
        <ol>
          {stages.map((s) => (
            <li key={s.index}>
              {s.label} — {s.body}
            </li>
          ))}
        </ol>
      </div>

      <div
        ref={stageRef}
        data-pb-stage
        className="pb-stage sticky top-0 w-full select-none overflow-hidden"
        style={{ height, color: FG }}
      >
        <div
          ref={glowRef}
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 rounded-full"
          style={{
            width: GLOW_BASE,
            height: GLOW_BASE,
            transformOrigin: "0 0",
            background: "radial-gradient(closest-side, " + EMBER + "3d, " + EMBER + "12 45%, transparent 100%)",
            willChange: "transform",
          }}
        />
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 block"
          style={{ width: "100%", height: "100%", maxWidth: "none" }}
        />

        {/* ---- the six stages (decorative restatement) ---- */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={DISPLAY}>
          {stages.map((stage, i) => (
            <StageFrame
              key={stage.index}
              stage={stage}
              scene={i}
              total={total}
              variant={VARIANTS[i % VARIANTS.length]}
            />
          ))}
        </div>

        {/* ---- closing (real content: it holds the one link) ---- */}
        <div className="pointer-events-none absolute inset-0" style={DISPLAY}>
          <div style={at({ left: "5cqw", right: "5cqw", bottom: "10cqh" })}>
            <div className="pb-hide-sm" style={{ width: "18cqw", marginBottom: "3.5cqh" }}>
              <span
                {...sc(stageCount, "line", 0.12)}
                style={{ ...HIDDEN, display: "block", height: 1, width: "100%", background: FG + "26", transformOrigin: "left" }}
              />
            </div>
            <span
              {...sc(stageCount, "rise", 0.18)}
              style={{ ...HIDDEN, ...MONO, display: "block", color: EMBER }}
            >
              {closing.eyebrow}
            </span>
            <p
              {...sc(stageCount, "rise", 0.26)}
              style={{
                ...HIDDEN,
                ...DISPLAY,
                margin: "2.5cqh 0 0",
                maxWidth: "22ch",
                fontSize: "min(7.2cqw, 9.5cqh)",
                lineHeight: 0.95,
                letterSpacing: "-0.02em",
                textTransform: "uppercase",
                color: FG,
              }}
            >
              {closing.headline}
            </p>
            <p
              {...sc(stageCount, "rise", 0.4)}
              style={{ ...HIDDEN, ...SANS, margin: "3cqh 0 0", color: FG_MUTED }}
            >
              {closing.body}
            </p>
            <a
              {...sc(stageCount, "rise", 0.5)}
              href={closing.ctaHref}
              className="pb-cta pointer-events-auto"
              style={{ ...HIDDEN, ...MONO, display: "inline-flex", alignItems: "center", gap: "0.7em", marginTop: "4.5cqh", color: EMBER, textDecoration: "none", pointerEvents: "auto" }}
            >
              {closing.ctaLabel}
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>

        {/* ---- progress ticks ---- */}
        <div
          aria-hidden="true"
          className="pb-rail pb-hide-sm"
          style={{ ...MONO, position: "absolute", right: "2.6cqw", top: "50%", transform: "translateY(-50%)" }}
        >
          {Array.from({ length: sceneCount }, (_, i) => (
            <i key={i} {...(i === active ? { "data-on": "" } : {})} />
          ))}
        </div>
      </div>
    </section>
  )
}
