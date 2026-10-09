"use client";

import { useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Section, SectionHeading } from "@/components/ui/card";
import { SplitText } from "@/components/animations/split-text";
import { cn } from "@/lib/utils";

const items = [
  {
    number: "01",
    title: "AI AGENTS",
    desc: "Exploring agent workflows, tool use, and practical automation.",
  },
  {
    number: "02",
    title: "CREATIVE WEBGL",
    desc: "Experimenting with OGL, shaders, and subtle interactive atmospheres.",
  },
  {
    number: "03",
    title: "FULL-STACK SYSTEMS",
    desc: "Deepening schema design, auth, and performance-minded architecture.",
  },
  {
    number: "04",
    title: "AUTOMATION",
    desc: "Building small tools to eliminate repetitive work.",
  },
  {
    number: "05",
    title: "INTERACTIVE UI",
    desc: "Refining motion, micro-interactions, and tactile UX details.",
  },
];

export function CurrentlyExploringSection() {
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollTrack = (dir: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector<HTMLElement>("article");
    const step = card
      ? card.offsetWidth + 16
      : Math.max(280, track.clientWidth * 0.8);
    track.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <Section id="now">
      <SectionHeading
        index="/ 07"
        eyebrow="Now / Currently exploring"
        title={<SplitText text="Currently exploring." duration={1} />}
        lede="Areas I'm actively exploring and building toward as I grow as a product builder."
      />

      <div className="relative">
        {/* edge fades hint there is more off-screen */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-canvas to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-canvas to-transparent"
        />

        <div
          ref={trackRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((item, i) => (
            <article
              key={item.number}
              className="group card-lift edge-glow flex w-[min(84vw,22rem)] shrink-0 snap-start flex-col overflow-hidden rounded-card border border-line bg-surface"
            >
              {/* Distinct generative visual per topic */}
              <div
                aria-hidden="true"
                className="relative h-36 overflow-hidden border-b border-line"
              >
                <TopicArt index={i} />
                <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
              </div>
              <div className="flex flex-1 flex-col gap-4 p-6">
                <div className="flex items-center justify-between">
                  <span className="type-mono text-accent tabular-nums">
                    {item.number}
                  </span>
                  <span
                    aria-hidden="true"
                    className="ml-4 h-px flex-1 bg-line transition-colors duration-300 group-hover:bg-accent/40"
                  />
                </div>
                <h3 className="type-display text-h4 tracking-tight text-fg">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-fg-muted">
                  {item.desc}
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="type-mono text-[0.6875rem] text-fg-subtle">
            swipe or use the arrows — five active threads
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollTrack(-1)}
              aria-label="Scroll exploring topics backward"
              className="grid size-10 place-items-center rounded-full border border-line text-fg-muted transition-colors duration-300 hover:border-accent hover:text-fg"
            >
              <ArrowLeft className="size-4" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => scrollTrack(1)}
              aria-label="Scroll exploring topics forward"
              className="grid size-10 place-items-center rounded-full border border-line text-fg-muted transition-colors duration-300 hover:border-accent hover:text-fg"
            >
              <ArrowRight className="size-4" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* Small generative banner per topic: orb, refracted bands, stacked layers,
   node mesh, concentric rings. Pure CSS, transform/opacity only. */
function TopicArt({ index }: { index: number }) {
  switch (index % 5) {
    case 0: // AI Agents — luminous orb
      return (
        <div className="absolute inset-0 bg-[radial-gradient(60%_75%_at_50%_58%,color-mix(in_oklab,var(--color-violet-500)_38%,transparent),transparent_72%),radial-gradient(30%_34%_at_50%_52%,color-mix(in_oklab,var(--color-pulse-300)_30%,transparent),transparent_70%)]">
          <div className="glow-orb absolute left-1/2 top-1/2 size-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--color-violet-300)_70%,transparent),transparent_70%)] blur-[2px]" />
        </div>
      );
    case 1: // Creative WebGL — refracted light bands
      return (
        <div className="absolute inset-0 overflow-hidden bg-[linear-gradient(115deg,color-mix(in_oklab,var(--color-signal-500)_16%,transparent),transparent_55%),linear-gradient(245deg,color-mix(in_oklab,var(--color-pulse-400)_14%,transparent),transparent_55%)]">
          <div className="absolute -left-1/4 top-0 h-[200%] w-1/3 rotate-[18deg] bg-[linear-gradient(to_bottom,transparent,color-mix(in_oklab,var(--color-signal-300)_35%,transparent),transparent)] blur-md" />
          <div className="absolute left-1/3 top-0 h-[200%] w-1/4 rotate-[18deg] bg-[linear-gradient(to_bottom,transparent,color-mix(in_oklab,var(--color-violet-300)_30%,transparent),transparent)] blur-md" />
          <div className="absolute left-2/3 top-0 h-[200%] w-1/5 rotate-[18deg] bg-[linear-gradient(to_bottom,transparent,color-mix(in_oklab,var(--color-pulse-300)_28%,transparent),transparent)] blur-md" />
        </div>
      );
    case 2: // Full-Stack Systems — layered structures
      return (
        <div className="absolute inset-0 bg-[radial-gradient(70%_80%_at_50%_110%,color-mix(in_oklab,var(--color-signal-500)_22%,transparent),transparent_70%)]">
          {[0, 1, 2].map((r) => (
            <div
              key={r}
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 rounded-[0.6rem] border border-signal-400/40"
              style={{
                width: `${7 + r * 3.2}rem`,
                height: `${2.4 + r * 1.1}rem`,
                transform: `translate(-50%, ${-58 + r * 26}%)`,
                opacity: 0.85 - r * 0.22,
              }}
            />
          ))}
        </div>
      );
    case 3: // Automation — node mesh
      return (
        <div className="absolute inset-0 bg-[radial-gradient(60%_70%_at_50%_50%,color-mix(in_oklab,var(--color-signal-500)_18%,transparent),transparent_70%)]">
          <svg viewBox="0 0 200 100" className="absolute inset-0 h-full w-full">
            <g stroke="var(--color-signal-400)" strokeWidth="0.7" opacity="0.65">
              <line x1="30" y1="60" x2="80" y2="30" />
              <line x1="80" y1="30" x2="130" y2="55" />
              <line x1="130" y1="55" x2="170" y2="28" />
              <line x1="30" y1="60" x2="90" y2="75" />
              <line x1="90" y1="75" x2="130" y2="55" />
              <line x1="90" y1="75" x2="160" y2="72" />
            </g>
            <g fill="var(--color-pulse-300)">
              <circle cx="30" cy="60" r="2.4" />
              <circle cx="80" cy="30" r="2.4" />
              <circle cx="130" cy="55" r="2.4" />
              <circle cx="170" cy="28" r="2.4" />
              <circle cx="90" cy="75" r="2.4" />
              <circle cx="160" cy="72" r="2.4" />
            </g>
          </svg>
        </div>
      );
    default: // Interactive UI — concentric rings
      return (
        <div className="absolute inset-0 bg-[radial-gradient(60%_70%_at_50%_50%,color-mix(in_oklab,var(--color-violet-500)_20%,transparent),transparent_70%)]">
          {[0, 1, 2, 3].map((r) => (
            <div
              key={r}
              aria-hidden="true"
              className={cn(
                "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border",
                r === 1 && "float-slow",
                r === 2 && "float-slower",
              )}
              style={{
                width: `${2.5 + r * 2.2}rem`,
                height: `${2.5 + r * 2.2}rem`,
                borderColor: `color-mix(in oklab, var(--color-${r % 2 ? "pulse-300" : "violet-400"}) ${52 - r * 8}%, transparent)`,
              }}
            />
          ))}
        </div>
      );
  }
}
