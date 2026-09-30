import type { Skill } from "@/lib/db/schema";
import { Card, Section, SectionHeading, PlaceholderNote } from "@/components/ui/card";
import { Reveal, Stagger } from "@/components/animations/motion-primitives";
import { SplitText } from "@/components/animations/split-text";
import { Spotlight, Tilt } from "@/components/ui/magnetic";
import { TechMark } from "@/components/ui/tech-mark";
import { SplitSkillRow } from "./skill-row";
import {
  gridTech,
  leadTech,
  techSpanAt,
  type TechEntry,
} from "@/components/sections/tech-stack-data";

/* ==========================================================================
   Stack — the capabilities section, as a bento.

   Server Component. Every client boundary below (Tilt, Spotlight, Reveal,
   Stagger, SplitText) is a leaf, so none of this content is shipped as JS.

   Structure:
     A. an asymmetric opener — the professional strengths from the database
        beside one large "lead" technology cell
     B. a bento of the remaining technologies, on a cycling span pattern that
        closes every row at 12 columns and needs no change to scale

   Motion ownership (MOTION.md):
     - Stagger owns transform/opacity on the OUTER cell wrapper
     - Tilt owns transform on its OWN inner element
     - Spotlight owns two custom properties, no transform at all
     - Card's own transition is border/background/box-shadow only
   They are deliberately four different elements deep so nothing overlaps.
   ========================================================================== */

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
        lede="A computer science foundation, a set of professional skills, and the tools I reach for when building."
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

            <div className="mt-auto pt-6">
              <PlaceholderNote>
                Specific technologies, tools and libraries used in past
                projects have not been provided. Add them per category from the
                admin dashboard and they will appear here automatically.
              </PlaceholderNote>
            </div>
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
        className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-6 lg:mt-5 lg:grid-cols-12 lg:gap-5"
        step={0.07}
      >
        {grid.map((tech, i) => (
          <div key={tech.name} className={techSpanAt(i)}>
            <TechCell tech={tech} />
          </div>
        ))}
      </Stagger>

      <Reveal>
        <p className="type-mono mt-8 max-w-[62ch] leading-relaxed text-fg-subtle">
          Everything on the right is a verifiable property of this repository,
          not a claim about client work. Tools used in specific projects are
          listed on that project&apos;s own case study.
        </p>
      </Reveal>
    </Section>
  );
}

/* --------------------------------------------------------------------------
   Lead cell — the oversized one.
   -------------------------------------------------------------------------- */

function LeadCell({ tech }: { tech: TechEntry }) {
  return (
    <Tilt max={2.2} className="h-full">
      <Spotlight radius={520} className="h-full rounded-card">
        <Card
          sweep
          /* Fill comes from the spotlight wrapper so the glow is not painted
             over. See the Spotlight rule in globals.css. */
          surface={false}
          className="group/lead relative flex h-full flex-col justify-between gap-10 overflow-hidden p-[clamp(1.75rem,3.5vw,3rem)]"
        >
          {/* Gradient wash, stronger than the standard cell treatment. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_100%_at_88%_0%,color-mix(in_oklab,var(--accent)_17%,transparent),transparent_62%)] transition-opacity duration-700 group-hover/lead:opacity-80"
          />

          <div className="flex items-start justify-between gap-6">
            <span className="grid size-14 shrink-0 place-items-center rounded-card border border-line bg-surface-strong text-accent">
              <TechMark mark={tech.mark} className="size-7" />
            </span>
            <span className="type-mono text-fg-subtle">01</span>
          </div>

          <div>
            <h3 className="type-display text-h2 leading-[0.9] text-fg">
              {tech.name}
            </h3>
            <p className="mt-4 max-w-[42ch] text-body leading-relaxed text-fg-muted">
              {tech.role}
            </p>
          </div>
        </Card>
      </Spotlight>
    </Tilt>
  );
}

/* --------------------------------------------------------------------------
   Standard bento cell.
   -------------------------------------------------------------------------- */

function TechCell({ tech }: { tech: TechEntry }) {
  return (
    <Tilt max={2.6} className="h-full">
      <Spotlight radius={340} className="h-full rounded-card">
        <Card
          sweep
          surface={false}
          className="group/cell relative flex h-full flex-col justify-between gap-8 overflow-hidden p-6"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(100%_80%_at_100%_0%,color-mix(in_oklab,var(--accent)_12%,transparent),transparent_60%)] opacity-0 transition-opacity duration-700 group-hover/cell:opacity-100"
          />

          <div className="flex items-start justify-between gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-lg border border-line bg-surface-strong text-fg-muted transition-colors duration-500 group-hover/cell:border-accent/40 group-hover/cell:text-accent">
              <TechMark mark={tech.mark} className="size-[1.4rem]" />
            </span>
          </div>

          <div>
            <h3 className="font-display text-[1.15rem] font-semibold leading-tight tracking-tight text-fg">
              {tech.name}
            </h3>
            <p className="mt-2.5 text-[0.8125rem] leading-snug text-fg-muted">
              {tech.role}
            </p>
          </div>
        </Card>
      </Spotlight>
    </Tilt>
  );
}
