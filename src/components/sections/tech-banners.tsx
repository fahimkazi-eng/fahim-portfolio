import type { ReactNode } from "react";

/* ==========================================================================
   Technology banners — one animated scene per technology.

   Every banner is pure markup: SVG, spans and divs, animated by CSS keyframes
   declared in globals.css. There is no JS in here at all, which is the point:
   a Server Component renders this to static HTML, the browser animates it on
   the compositor, and nothing re-renders. That also means it degrades exactly
   right — with reduced motion or CSS animations off, every scene falls back to
   its final state (which is what `animation-fill-mode: both` holds) and reads
   as a still diagram of what the technology does.

   Conventions, so the ten scenes feel like one system:

     - Colour. Nothing here names a colour. Each scene reads `--tech-h`, which
       the card sets from the technology's own hue. Only `--tech-l`/`--tech-s`
       (global, per theme) turn that into a colour, so contrast and saturation
       are decided once for the whole section.
     - Motion. Only `transform`, `opacity` and `background-position` animate.
       No layout, no width/height/top/left, so nothing triggers reflow. This
       is a deliberate constraint from MOTION.md.
     - Timing. Each technology gets a different duration and easing so the grid
       does not pulse in lockstep.
     - Structure. Every scene is an absolutely-positioned layer inside a
       `relative overflow-hidden` stage with its own aspect ratio, so a banner
       never affects the card's height or the grid's rhythm.

   Each scene is written to be legible as a still frame, because that is the
   reduced-motion state and because a static screenshot of this section should
   still tell you what the technology does.
   ========================================================================== */

export type BannerKey =
  | "router"
  | "types"
  | "utilities"
  | "database"
  | "schema"
  | "validation"
  | "timeline"
  | "spring"
  | "inertia"
  | "shader";

/* --------------------------------------------------------------------------
   Shared pieces
   -------------------------------------------------------------------------- */

/**
 * The stage. A fixed-ratio window the scenes are composed inside, so the
 * banner is a consistent shape regardless of the card's width.
 *
 * `aria-hidden` because every banner is decoration: the technology's name and
 * description are real text in the card, so a screen reader announcing the
 * diagram as well would just be noise.
 */
function Stage({
  children,
  className = "",
  tall = false,
}: {
  children: ReactNode;
  className?: string;
  /** Taller stage for the lead banner, which has room for a real scene. */
  tall?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={`tech-stage ${tall ? "tech-stage-tall" : ""} ${className}`}
    >
      <span className="tech-stage-grain" />
      {children}
    </div>
  );
}

/* --------------------------------------------------------------------------
   1. Next.js — layered routes, and the server/client boundary.

   The App Router story is "a tree of routes, resolved on the server, streamed
   to the client". So: three page panes stacked in depth, a server node
   resolving into them, and a client bundle hydrating the frontmost pane only.
   -------------------------------------------------------------------------- */
function RouterBanner({ tall = false }: { tall?: boolean }) {
  return (
    <Stage tall={tall}>
      {/* Depth: two pages behind, offset up-left and up-right. */}
      <div className="tech-page tech-page-back" />
      <div className="tech-page tech-page-mid" />

      {/* The live page. */}
      <div className="tech-page tech-page-front">
        <div className="tech-page-bar">
          <span className="tech-dot" />
          <span className="tech-dot" />
          <span className="tech-dot" />
        </div>
        {/* Streamed server component arriving as a skeleton, then filling in. */}
        <div className="tech-page-rows">
          <span className="tech-skel tech-skel-wide" />
          <span className="tech-skel" />
          <span className="tech-skel tech-skel-short" />
        </div>
        {/* Client island: only this subtree hydrates. */}
        <div className="tech-island">
          <span className="tech-island-label">use client</span>
          <span className="tech-island-pulse" />
        </div>
      </div>

      {/* The request path resolving: a travelling dot on a route line. */}
      <svg className="tech-overlay" viewBox="0 0 200 120" preserveAspectRatio="none">
        <path
          className="tech-route-line"
          d="M8 108 C 46 108 40 74 74 74 L 150 74"
          pathLength="100"
        />
        <circle className="tech-route-dot" r="3.2">
          <animateMotion
            dur="4.2s"
            repeatCount="indefinite"
            path="M8 108 C 46 108 40 74 74 74 L 150 74"
          />
        </circle>
      </svg>

      <span className="tech-server-tag">RSC</span>
    </Stage>
  );
}

/* --------------------------------------------------------------------------
   2. TypeScript — a live editor with a type checker.

   Real code from this repo, with a caret that types one clause, then the
   checker resolving green. The green check is the point of the technology, so
   it gets the most colour in the scene.
   -------------------------------------------------------------------------- */
function TypesBanner() {
  return (
    <Stage>
      <div className="tech-editor">
        <div className="tech-editor-gutter">
          <span>1</span>
          <span>2</span>
          <span>3</span>
          <span>4</span>
        </div>
        <pre className="tech-code">
          <code>
            <span className="tech-kw">type</span>{" "}
            <span className="tech-type">Project</span> = {`{`}
            {"\n"}
            {"  "}
            <span className="tech-prop">slug</span>
            <span className="tech-punct">:</span>{" "}
            <span className="tech-type">string</span>
            <span className="tech-punct">;</span>
            {"\n"}
            {"  "}
            <span className="tech-prop">live</span>
            <span className="tech-punct">?:</span>{" "}
            <span className="tech-type">string</span>
            <span className="tech-punct">;</span>
            {"\n"}
            <span className="tech-punct">{"}"}</span>
            <span className="tech-caret" />
          </code>
        </pre>
      </div>

      {/* The checker: a squiggle that resolves to a tick. */}
      <div className="tech-checker">
        <span className="tech-checker-bar" />
        <span className="tech-checker-tick" />
      </div>

      <span className="tech-badge tech-badge-ok">0 errors</span>
    </Stage>
  );
}

/* --------------------------------------------------------------------------
   3. Tailwind — utilities composing into a layout.

   Shows the actual claim of the technology: a pile of small utility classes
   on the left assembling, on the right, into one composed component that then
   reflows between breakpoints.
   -------------------------------------------------------------------------- */
function UtilitiesBanner() {
  const chips = [
    "flex",
    "gap-4",
    "rounded-card",
    "p-6",
    "text-fg",
    "md:col-span-7",
  ];

  return (
    <Stage>
      {/* The raw utilities, drifting in one at a time. */}
      <div className="tech-chip-cloud">
        {chips.map((chip, i) => (
          <span key={chip} className="tech-chip" style={{ ["--i" as never]: i }}>
            {chip}
          </span>
        ))}
      </div>

      {/* What they compose into: a card that reflows on the breakpoint. */}
      <div className="tech-composed">
        <div className="tech-composed-bar" />
        <div className="tech-composed-grid">
          <span className="tech-composed-cell" />
          <span className="tech-composed-cell" />
          <span className="tech-composed-cell" />
        </div>
        <span className="tech-composed-label">md:col-span-7</span>
      </div>

      <svg className="tech-overlay" viewBox="0 0 200 120" preserveAspectRatio="none">
        <path className="tech-wire" d="M62 96 L 118 96" pathLength="100" />
      </svg>
    </Stage>
  );
}

/* --------------------------------------------------------------------------
   4. Neon Postgres — a serverless database under load.

   A stack of table planes, streams flowing in, and a query indicator that
   lights as rows land. "Neon" is serverless Postgres, so the storage should
   read as elastic and branching rather than a single rigid box.
   -------------------------------------------------------------------------- */
function DatabaseBanner() {
  return (
    <Stage>
      <svg className="tech-overlay" viewBox="0 0 200 120" preserveAspectRatio="none">
        {/* Branching connections from clients into the store. */}
        <path className="tech-db-link" d="M4 26 L 74 52" />
        <path className="tech-db-link tech-db-link-2" d="M4 60 L 74 60" />
        <path className="tech-db-link tech-db-link-3" d="M4 94 L 74 68" />
        <path className="tech-db-link" d="M126 60 L 196 60" />
      </svg>

      {/* Incoming rows. */}
      {[0, 1, 2].map((i) => (
        <span key={`in-${i}`} className="tech-row" style={{ ["--i" as never]: i }}>
          <span className="tech-row-key" />
        </span>
      ))}

      {/* The store itself: three offset table planes. */}
      <div className="tech-store">
        <span className="tech-store-plane" />
        <span className="tech-store-plane" />
        <span className="tech-store-plane tech-store-plane-top">
          <span className="tech-store-cell" />
          <span className="tech-store-cell" />
          <span className="tech-store-cell" />
        </span>
      </div>

      {/* Query activity. */}
      <span className="tech-badge tech-badge-query">SELECT · 12ms</span>
      <span className="tech-pulse-ring" />
    </Stage>
  );
}

/* --------------------------------------------------------------------------
   5. Drizzle ORM — typed schema and relations.

   The distinctive thing about Drizzle is that the schema IS TypeScript, so
   the scene is a small typed record feeding typed queries across a relation.
   -------------------------------------------------------------------------- */
function SchemaBanner() {
  return (
    <Stage>
      <div className="tech-typed">
        <span className="tech-typed-kw">pgTable</span>
        <span className="tech-typed-name">(</span>
        <span className="tech-typed-str">&quot;projects&quot;</span>
      </div>

      <svg className="tech-overlay" viewBox="0 0 200 120" preserveAspectRatio="none">
        {/* One row travelling the relation, table to table. */}
        <path className="tech-rel-line" d="M56 60 L 144 60" pathLength="100" />
        <rect className="tech-rel-packet" width="9" height="9" rx="2" y="55.5">
          <animateMotion
            dur="3.4s"
            repeatCount="indefinite"
            path="M56 60 L 144 60"
          />
        </rect>
      </svg>

      <div className="tech-table tech-table-a">
        <span className="tech-table-name">projects</span>
        <span className="tech-table-col" />
        <span className="tech-table-col" />
        <span className="tech-table-col" />
      </div>

      <div className="tech-table tech-table-b">
        <span className="tech-table-name">messages</span>
        <span className="tech-table-col" />
        <span className="tech-table-col" />
      </div>

      <span className="tech-badge">inferred</span>
    </Stage>
  );
}

/* --------------------------------------------------------------------------
   6. Zod — data through a validation pipeline.

   A payload meets a series of checks; the checks resolve green and the value
   is allowed through. One check rejects first, briefly, because a validator
   that has never failed is not doing its job.
   -------------------------------------------------------------------------- */
function ValidationBanner() {
  const checks = ["string", "email", "min(8)"];

  return (
    <Stage>
      <span className="tech-payload">payload</span>

      <div className="tech-pipeline">
        {checks.map((check, i) => (
          <div key={check} className="tech-gate" style={{ ["--i" as never]: i }}>
            <span className="tech-gate-bar" />
            <span className="tech-gate-tick" />
            <span className="tech-gate-label">{check}</span>
          </div>
        ))}
      </div>

      {/* The accept/reject decision. */}
      <div className="tech-verdict">
        <span className="tech-verdict-no">✕</span>
        <span className="tech-verdict-yes">✓</span>
      </div>

      <svg className="tech-overlay" viewBox="0 0 200 120" preserveAspectRatio="none">
        <path className="tech-pipe-line" d="M30 60 L 168 60" pathLength="100" />
      </svg>
    </Stage>
  );
}

/* --------------------------------------------------------------------------
   7. GSAP — a timeline with scrubbed tracks.

   The literal mental model: several tracks, a playhead, staggered elements
   and a progress readout. This is the most self-referential scene here, which
   is appropriate — it is a picture of the thing doing the animating.
   -------------------------------------------------------------------------- */
function TimelineBanner() {
  const tracks = [
    { name: "name", dots: 4, dur: "6s" },
    { name: "portrait", dots: 3, dur: "4.5s" },
    { name: "cta", dots: 2, dur: "3s" },
  ];

  return (
    <Stage>
      <div className="tech-tl">
        {tracks.map((track, i) => (
          <div key={track.name} className="tech-tl-track">
            <span className="tech-tl-label">{track.name}</span>
            <span className="tech-tl-lane">
              {Array.from({ length: track.dots }).map((_, d) => (
                <span
                  key={d}
                  className="tech-tl-key"
                  style={{
                    ["--d" as never]: d,
                    animationDuration: track.dur,
                    animationDelay: `${i * 0.12 + d * 0.09}s`,
                  }}
                />
              ))}
              {/* A block travelling the lane: the tween itself. */}
              <span
                className="tech-tl-block"
                style={{ animationDuration: track.dur, animationDelay: `${i * 0.12}s` }}
              />
            </span>
          </div>
        ))}

        {/* Playhead and scrub progress. */}
        <span className="tech-tl-playhead" />
        <span className="tech-tl-progress" />
      </div>

      <span className="tech-badge">scrollTrigger</span>
    </Stage>
  );
}

/* --------------------------------------------------------------------------
   8. Motion — layout animation and spring physics.

   Boxes that rearrange themselves, and one element that overshoots on a
   spring. The overshoot is the recognisable part, so it gets the accent.
   -------------------------------------------------------------------------- */
function SpringBanner() {
  return (
    <Stage>
      <div className="tech-motion-grid">
        <span className="tech-motion-box tech-motion-a" />
        <span className="tech-motion-box tech-motion-b" />
        <span className="tech-motion-box tech-motion-c" />
        <span className="tech-motion-box tech-motion-d" />
      </div>

      {/* A spring: travels, overshoots, settles. Non-symmetric on purpose. */}
      <div className="tech-spring-track">
        <span className="tech-spring-dot" />
      </div>

      {/* Hover response, simulated: a bar that fills. */}
      <div className="tech-hover-bar">
        <span className="tech-hover-fill" />
      </div>
    </Stage>
  );
}

/* --------------------------------------------------------------------------
   9. Lenis — inertial scrolling.

   A wheel impulse and a body that keeps travelling after the input stops,
   which is the entire distinguishing behaviour of the library. The dashed line
   is the input; the solid curve is the eased output.
   -------------------------------------------------------------------------- */
function InertiaBanner() {
  return (
    <Stage>
      <svg className="tech-overlay" viewBox="0 0 200 120" preserveAspectRatio="none">
        {/* Input: sharp impulses. */}
        <path className="tech-inertia-input" d="M6 96 L 54 96" pathLength="100" />
        <path
          className="tech-inertia-input tech-inertia-input-2"
          d="M74 96 L 122 96"
          pathLength="100"
        />
        {/* Output: eased travel that decays. */}
        <path
          className="tech-inertia-curve"
          d="M6 96 C 60 96 66 52 104 46 C 140 40 158 60 194 58"
          pathLength="100"
        />
        <circle className="tech-inertia-head" r="4">
          <animateMotion
            dur="3.2s"
            repeatCount="indefinite"
            path="M6 96 C 60 96 66 52 104 46 C 140 40 158 60 194 58"
          />
        </circle>
      </svg>

      {/* The content being scrolled, and the velocity readout. */}
      <div className="tech-scroll-body">
        <span className="tech-scroll-line" />
        <span className="tech-scroll-line tech-scroll-line-wide" />
        <span className="tech-scroll-line" />
      </div>

      <span className="tech-badge tech-badge-vel">lerp 0.1</span>
    </Stage>
  );
}

/* --------------------------------------------------------------------------
   10. OGL — the shader.

   The one technology on this site whose entire job is procedural colour, so
   this scene is the only one built from layered blurred gradients and noise
   rather than from diagram shapes. Kept to CSS here on purpose: the page
   already runs one persistent WebGL canvas for the hero, and starting a
   second GL context per card to render a 160px field would cost far more than
   it returns. The hero canvas IS this technology doing real work.
   -------------------------------------------------------------------------- */
function ShaderBanner() {
  return (
    <Stage className="tech-stage-shader">
      <span className="tech-aurora tech-aurora-a" />
      <span className="tech-aurora tech-aurora-b" />
      <span className="tech-aurora tech-aurora-c" />

      {/* Particle field over the colour. */}
      <div className="tech-particles">
        {Array.from({ length: 14 }).map((_, i) => (
          <span
            key={i}
            className="tech-particle"
            style={{
              ["--x" as never]: `${8 + ((i * 37) % 84)}%`,
              ["--y" as never]: `${12 + ((i * 53) % 76)}%`,
              animationDelay: `${(i % 7) * 0.42}s`,
              animationDuration: `${5 + (i % 5) * 0.8}s`,
            }}
          />
        ))}
      </div>

      {/* The triangle the renderer actually draws, plus a wireframe. */}
      <svg className="tech-overlay" viewBox="0 0 200 120">
        <polygon className="tech-tri-fill" points="100,26 152,96 48,96" />
        <polygon className="tech-tri-line" points="100,26 152,96 48,96" />
      </svg>

      <span className="tech-badge tech-badge-gl">gl_FragColor</span>
    </Stage>
  );
}

/* --------------------------------------------------------------------------
   Registry
   -------------------------------------------------------------------------- */

const BANNERS: Record<BannerKey, () => ReactNode | null> = {
  router: () => <RouterBanner />,
  types: TypesBanner,
  utilities: UtilitiesBanner,
  database: DatabaseBanner,
  schema: SchemaBanner,
  validation: ValidationBanner,
  timeline: TimelineBanner,
  spring: SpringBanner,
  inertia: InertiaBanner,
  shader: ShaderBanner,
};

/**
 * Render the scene for a banner key. An unknown key renders nothing rather
 * than throwing: a technology added to the database without a banner should
 * still show as a card, just without the illustration.
 *
 * `tall` gives the lead technology a wider, shorter stage — it has the width
 * for a cinematic plate, and a 16:10 crop of the same scene would be too short
 * to read at that size.
 */
export function TechBanner({
  banner,
  tall = false,
}: {
  banner: BannerKey;
  tall?: boolean;
}) {
  const Scene = BANNERS[banner];
  if (!Scene) return null;

  /* `tall` is only meaningful for the lead banner. Rather than threading the
     prop through all ten scenes, the stage height is chosen here from the
     wrapper element that is about to be rendered. */
  if (tall && banner === "router") return <RouterBanner tall />;

  return <Scene />;
}