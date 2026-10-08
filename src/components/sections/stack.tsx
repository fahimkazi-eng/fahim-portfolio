import type { CSSProperties } from "react";
import type { Skill } from "@/lib/db/schema";
import { Card, Section, SectionHeading } from "@/components/ui/card";
import { Reveal, Stagger } from "@/components/animations/motion-primitives";
import { SplitText } from "@/components/animations/split-text";
import { Spotlight, Tilt } from "@/components/ui/magnetic";
import { TechMark } from "@/components/ui/tech-mark";
import { SplitSkillRow } from "./skill-row";
import { TechBanner } from "@/components/sections/tech-banners";
import { StackArchitecture } from "@/components/sections/stack-architecture";
import {
  gridTech,
  leadTech,
  techSpanAt,
  type TechEntry,
} from "@/components/sections/tech-stack-data";

/* ==========================================================================
   Stack — the capabilities section.

   Server Component. The only client boundaries are leaves (Tilt, Spotlight,
   Reveal, Stagger, SplitText, SplitSkillRow), so the section's content is
   shipped as HTML and the banners cost nothing in JS.

   Structure:
     A. an asymmetric opener — the professional strengths from the database
        beside one large "lead" technology, which carries a full-height banner
     B. a bento of the remaining technologies, on a cycling span pattern that
        closes every row at 12 columns and needs no change to scale

   Motion ownership (MOTION.md) — unchanged from before the banners, and the
   banners deliberately stay out of it:
     - Stagger owns transform/opacity on the OUTER cell wrapper
     - Tilt owns transform on its OWN inner element
     - Spotlight owns two custom properties, no transform at all
     - Card's own transition is border/background/box-shadow only
   The banner scenes are separate elements deeper still, animated by CSS
   keyframes. Nothing in this file animates a property a banner also animates.
   ========================================================================== */

/** The hue this card's banner and accents read from. */
function hueVars(hue: number): CSSProperties {
  return { ["--tech-h" as never]: String(hue) };
}

export function StackSection({ skills }: { skills: Skill[] }) {
  const grouped = skills.reduce<Record<string, Skill[]>>((acc, skill) => {
    (acc[skill.category] ??= []).push(skill);
    return acc;
  }, {});

  const categories = Object.entries(grouped);
  const lead = leadTech();
  const grid = gridTech();

  return (
    <Section id="stack" className="overflow-hidden">
      {/* Ambient colour mesh. One element, CSS-driven, transform-only. It sits
          behind everything and is inert to the pointer. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -left-[18%] top-[6%] size-[38rem] rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--accent)_15%,transparent),transparent_68%)] blur-3xl [animation:mesh-drift_26s_ease-in-out_infinite]" />
        <div className="absolute -right-[14%] bottom-[2%] size-[32rem] rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--accent)_11%,transparent),transparent_70%)] blur-3xl [animation:mesh-drift_34s_ease-in-out_infinite_reverse]" />
      </div>

      <SectionHeading
        index="02"
        eyebrow="Capabilities"
        title={<SplitText text="What I work with." duration={1} />}
        lede="A computer science foundation, a set of professional skills, and the tools I reach for when building. Each one is drawn as what it actually does."
      />

      {/* ---------------- A. opener ---------------- */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
        {/* Professional strengths — straight from the database. */}
        <Reveal className="lg:col-span-5">
          <Card className="flex h-full flex-col p-[clamp(1.5rem,2.5vw,2.25rem)]">
            <div className="mb-6 flex items-baseline justify-between gap-4">
              <h3 className="type-mono text-fg-muted">
                Professional strengths
              </h3>
              <span className="type-mono text-accent tabular-nums">
                {String(skills.length).padStart(2, "0")}
              </span>
            </div>

            {categories.map(([category, items], groupIndex) => (
              <div key={category} className="mb-7 last:mb-0">
                <p className="type-mono mb-2.5 text-accent">
                  {String(groupIndex + 1).padStart(2, "0")} · {category}
                </p>
                <ul className="space-y-px overflow-hidden rounded-lg border border-line bg-line">
                  {items.map((skill) => (
                    <SplitSkillRow key={skill.id} skill={skill} />
                  ))}
                </ul>
              </div>
            ))}
          </Card>
        </Reveal>

        {/* The lead technology, given room to breathe. */}
        {lead ? (
          <Reveal className="lg:col-span-7" delay={0.08}>
            <LeadCell tech={lead} />
          </Reveal>
        ) : null}
      </div>

      {/* ---------------- B. the bento ---------------- */}
      <Stagger
        className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-6 lg:mt-5 lg:grid-cols-12 lg:gap-5"
        step={0.07}
      >
        {grid.map((tech, i) => (
          <div key={tech.name} className={techSpanAt(i)}>
            <TechCell tech={tech} />
          </div>
        ))}
      </Stagger>

      <StackArchitecture />

      <Reveal>
        <p className="type-mono mt-8 max-w-[62ch] leading-relaxed text-fg-subtle">
          Every technology above is a verifiable property of this repository,
          not a claim about client work. Each banner animates with CSS only —
          no JavaScript runs for them.
        </p>
      </Reveal>
    </Section>
  );
}

/* --------------------------------------------------------------------------
   Lead cell — the oversized one, with a full-height banner.

   Composition differs from the standard cell on purpose: here the banner sits
   ABOVE the text as a wide cinematic plate, rather than as an inset block. It
   is the biggest technology on the site and gets the biggest gesture.
   -------------------------------------------------------------------------- */
function LeadCell({ tech }: { tech: TechEntry }) {
  return (
    <Tilt max={2} className="h-full">
      <Spotlight radius={520} className="h-full rounded-card">
        <Card
          sweep
          /* Fill comes from the spotlight wrapper so the glow is not painted
             over. See the Spotlight rule in globals.css. */
          surface={false}
          style={hueVars(tech.hue)}
          className="group/lead relative flex h-full flex-col overflow-hidden p-[clamp(1.5rem,2.6vw,2.25rem)]"
        >
          <span aria-hidden="true" className="tech-lead-edge" />

          {/* The banner plate. */}
          <div className="relative mb-[clamp(1.5rem,2.4vw,2.25rem)]">
            {tech.banner ? <TechBanner banner={tech.banner} tall /> : null}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[var(--tech-surface)] to-transparent" />
          </div>

          <div className="mt-auto flex items-start justify-between gap-6">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <span className="tech-mark-chip">
                  <TechMark mark={tech.mark} className="size-[1.35rem]" />
                </span>
                <span className="type-mono text-fg-subtle">01</span>
              </div>
              <h3 className="type-display text-h3 leading-[0.92] text-fg">
                {tech.name}
              </h3>
              <p className="mt-3 max-w-[46ch] text-body leading-relaxed text-fg-muted">
                {tech.role}
              </p>
            </div>
          </div>
        </Card>
      </Spotlight>
    </Tilt>
  );
}

/* --------------------------------------------------------------------------
   Standard bento cell — banner above, text below.

   Every cell is the same structure but the banner inside differs, and the
   cell's own padding/ordering comes from the span, so the grid keeps an
   irregular rhythm while the internal anatomy stays consistent and legible.
   -------------------------------------------------------------------------- */
function TechCell({ tech }: { tech: TechEntry }) {
  return (
    <Tilt max={2.6} className="h-full">
      <Spotlight radius={340} className="h-full rounded-card">
        <Card
          sweep
          surface={false}
          style={hueVars(tech.hue)}
          className="group/cell relative flex h-full flex-col overflow-hidden p-5 sm:p-6"
        >
          <span aria-hidden="true" className="tech-cell-edge" />

          {tech.banner ? (
            <div className="relative mb-5">
              <TechBanner banner={tech.banner} />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[var(--tech-surface)] to-transparent" />
            </div>
          ) : null}

          <div className="mt-auto">
            <div className="mb-3.5 flex items-center gap-3">
              <span className="tech-mark-chip tech-mark-chip-sm">
                <TechMark mark={tech.mark} className="size-4" />
              </span>
            </div>
            <h3 className="font-display text-[1.15rem] font-semibold leading-tight tracking-tight text-fg">
              {tech.name}
            </h3>
            <p className="mt-2 text-[0.8125rem] leading-snug text-fg-muted">
              {tech.role}
            </p>
          </div>
        </Card>
      </Spotlight>
    </Tilt>
  );
}