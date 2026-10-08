"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/* ==========================================================================
   Stack Architecture — an interactive "how the stack fits together" diagram.

   Unlike the bento (which lists technologies), this shows the *relationships*
   between them: PRODUCT sits on two trunks, FRONTEND and BACKEND both feed
   MOTION, and everything sits on WEBGL. Hovering or focusing a node brings its
   connections to life while the rest of the system dims — the message is "I
   understand how technologies work together", not "I know twenty logos".

   Cost control:
   - One `hovered` string of state (null | node id). No arrays, no per-node
     subscriptions; every highlight is a class toggle on ~20 elements.
   - All animation is CSS `transition` on `opacity`/`color`. Nothing in here
     touches GSAP/Motion, which own the page-level scroll motion.
   - The diagram is fully usable as a static graphic without any JS — hover
     only *emphasises*; the base state is dim and clear, not hidden.
   ========================================================================== */

type ArchNode = { id: string; label: string };

/** Split trunks (displayed side by side on md+). */
type SplitLayer = {
  kind: "split";
  id: string;
  leftTitle: string;
  leftNodes: ArchNode[];
  rightTitle: string;
  rightNodes: ArchNode[];
};

/** A single horizontal band (root / motion / webgl). */
type BandLayer = {
  kind: "band";
  id: string;
  title: string;
  nodes: ArchNode[];
};

export const ARCHITECTURE_LAYERS: (SplitLayer | BandLayer)[] = [
  {
    kind: "band",
    id: "product",
    title: "Product",
    nodes: [{ id: "product", label: "The product" }],
  },
  {
    kind: "split",
    id: "trunks",
    leftTitle: "Frontend",
    leftNodes: [
      { id: "next", label: "Next.js 16" },
      { id: "react", label: "React 19" },
      { id: "ts", label: "TypeScript" },
      { id: "tailwind", label: "Tailwind 4" },
    ],
    rightTitle: "Backend",
    rightNodes: [
      { id: "pg", label: "Neon Postgres" },
      { id: "drizzle", label: "Drizzle ORM" },
      { id: "zod", label: "Zod" },
      { id: "api", label: "Server Actions / API" },
    ],
  },
  {
    kind: "band",
    id: "motion",
    title: "Motion",
    nodes: [
      { id: "gsap", label: "GSAP" },
      { id: "motion", label: "Motion" },
      { id: "lenis", label: "Lenis" },
    ],
  },
  {
    kind: "band",
    id: "webgl",
    title: "WebGL",
    nodes: [{ id: "ogl", label: "OGL" }],
  },
];

/** Edges between layers. Each edge lists the node ids it connects. */
const EDGES: { id: string; from: string[]; to: string[] }[] = [
  { id: "e1", from: ["product"], to: ["next", "react", "ts", "tailwind"] },
  { id: "e2", from: ["product"], to: ["pg", "drizzle", "zod", "api"] },
  { id: "e3", from: ["ts"], to: ["gsap", "motion", "lenis"] },
  { id: "e4", from: ["tailwind"], to: ["motion"] },
  { id: "e5", from: ["api"], to: ["gsap", "motion", "lenis"] },
  { id: "e6", from: ["gsap"], to: ["ogl"] },
  { id: "e7", from: ["lenis"], to: ["ogl"] },
];

export function StackArchitecture() {
  const [hovered, setHovered] = useState<string | null>(null);

  /* A node id, or null when nothing is focused. */
  const connectedTo = (id: string) =>
    EDGES.filter((e) => e.from.includes(id) || e.to.includes(id)).flatMap((e) =>
      [...e.from, ...e.to].filter((n) => n !== id),
    );

  const isDimmed = hovered ? (id: string) => !connectedTo(hovered).includes(id) && id !== hovered : () => false;

  return (
    <div
      className="mt-[clamp(2.5rem,6vw,5rem)] rounded-card border border-line bg-surface/60 p-[clamp(1.25rem,3vw,2.5rem)]"
      onMouseLeave={() => setHovered(null)}
    >
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h3 className="type-mono text-fg-subtle">How it fits together</h3>
          <p className="mt-1 max-w-[50ch] text-sm leading-relaxed text-fg-muted">
            Hover a node to see what it connects to. Same system, different
            layers — product, interface, data, motion, rendering.
          </p>
        </div>
        <span aria-hidden="true" className="type-mono text-accent tabular-nums">
          02·SYS
        </span>
      </div>

      <ol className="space-y-4">
        {ARCHITECTURE_LAYERS.map((layer) => (
          <li key={layer.id}>
            {layer.kind === "band" ? (
              <BandRow
                layer={layer}
                hovered={hovered}
                isDimmed={isDimmed}
                onHover={setHovered}
              />
            ) : (
              <SplitRow
                layer={layer}
                hovered={hovered}
                isDimmed={isDimmed}
                onHover={setHovered}
              />
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

function BandRow({
  layer,
  hovered,
  isDimmed,
  onHover,
}: {
  layer: BandLayer;
  hovered: string | null;
  isDimmed: (id: string) => boolean;
  onHover: (id: string | null) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-12 sm:items-center">
      <div className="flex items-center gap-2 sm:col-span-4">
        <span
          className={cn(
            "type-mono text-accent transition-colors duration-300",
            hovered && !layer.nodes.some((n) => n.id === hovered)
              ? "opacity-40"
              : "opacity-100",
          )}
        >
          {layer.title}
        </span>
        <span aria-hidden="true" className="h-px flex-1 bg-line" />
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:col-span-8">
        {layer.nodes.map((node) => {
          const dimmed = hovered === null ? false : isDimmed(node.id);
          const active = hovered === node.id;
          return (
            <button
              key={node.id}
              type="button"
              onMouseEnter={() => onHover(node.id)}
              onFocus={() => onHover(node.id)}
              onBlur={() => onHover(null)}
              aria-pressed={active}
              className={cn(
                "inline-flex h-9 items-center rounded-pill border px-4 text-[0.8125rem] transition-all duration-300",
                active
                  ? "border-accent bg-accent/10 text-fg"
                  : "border-line bg-surface text-fg-muted",
                dimmed && "opacity-30",
              )}
            >
              {node.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SplitRow({
  layer,
  hovered,
  isDimmed,
  onHover,
}: {
  layer: SplitLayer;
  hovered: string | null;
  isDimmed: (id: string) => boolean;
  onHover: (id: string | null) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
      <div className="rounded-lg border border-line bg-surface/60 p-3 sm:col-span-6">
        <div className="mb-2 flex items-center gap-2">
          <span className={cn("type-mono text-accent transition-opacity duration-300", hovered && !layer.leftNodes.some((n) => n.id === hovered) ? "opacity-40" : "opacity-100")}>
            {layer.leftTitle}
          </span>
          <span aria-hidden="true" className="h-px flex-1 bg-line" />
        </div>
        <div className="flex flex-wrap gap-2">
          {layer.leftNodes.map((node) => (
            <NodePill
              key={node.id}
              node={node}
              hovered={hovered}
              dimmed={hovered === null ? false : isDimmed(node.id)}
              onHover={onHover}
            />
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-line bg-surface/60 p-3 sm:col-span-6">
        <div className="mb-2 flex items-center gap-2">
          <span className={cn("type-mono text-accent transition-opacity duration-300", hovered && !layer.rightNodes.some((n) => n.id === hovered) ? "opacity-40" : "opacity-100")}>
            {layer.rightTitle}
          </span>
          <span aria-hidden="true" className="h-px flex-1 bg-line" />
        </div>
        <div className="flex flex-wrap gap-2">
          {layer.rightNodes.map((node) => (
            <NodePill
              key={node.id}
              node={node}
              hovered={hovered}
              dimmed={hovered === null ? false : isDimmed(node.id)}
              onHover={onHover}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function NodePill({
  node,
  hovered,
  dimmed,
  onHover,
}: {
  node: ArchNode;
  hovered: string | null;
  dimmed: boolean;
  onHover: (id: string | null) => void;
}) {
  const active = hovered === node.id;
  return (
    <button
      type="button"
      onMouseEnter={() => onHover(node.id)}
      onFocus={() => onHover(node.id)}
      onBlur={() => onHover(null)}
      aria-pressed={active}
      className={cn(
        "inline-flex h-9 items-center rounded-pill border px-3.5 text-[0.8125rem] transition-all duration-300",
        active
          ? "border-accent bg-accent/10 text-fg"
          : "border-line bg-surface text-fg-muted",
        dimmed && "opacity-30",
      )}
    >
      {node.label}
    </button>
  );
}