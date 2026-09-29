import type { Skill } from "@/lib/db/schema";
import { Card, Section, SectionHeading, PlaceholderNote } from "@/components/ui/card";
import { Reveal, Stagger } from "@/components/animations/motion-primitives";
import { SplitText } from "@/components/animations/split-text";
import { SplitSkillRow } from "./skill-row";
import { TECH_STACK } from "@/components/sections/tech-stack-data";

/* ==========================================================================
   Stack — two halves.

   Left:  the professional strengths, straight from the database.
   Right: the tools this portfolio is actually built with, labelled as such
          (this site's stack, not a claim about past projects).
   ========================================================================== */

export function StackSection({ skills }: { skills: Skill[] }) {
  const grouped = skills.reduce<Record<string, Skill[]>>((acc, skill) => {
    (acc[skill.category] ??= []).push(skill);
    return acc;
  }, {});

  const categories = Object.entries(grouped);

  return (
    <Section id="stack">
      <SectionHeading
        index="02"
        eyebrow="Capabilities"
        title={<SplitText text="What I work with." duration={1} />}
        lede="A computer science foundation, a set of professional skills, and the tools I reach for when building."
      />

      <div className="grid grid-cols-1 gap-[clamp(2rem,5vw,4rem)] lg:grid-cols-12">
        {/* Professional skills from the DB */}
        <div className="lg:col-span-6">
          <h3 className="type-mono mb-5 text-fg-muted">Professional strengths</h3>

          {categories.map(([category, items], groupIndex) => (
            <div key={category} className="mb-8 last:mb-0">
              <p className="type-mono mb-3 text-accent/90">
                {String(groupIndex + 1).padStart(2, "0")} · {category}
              </p>
              <ul className="space-y-px overflow-hidden rounded-card border border-line bg-line">
                {items.map((skill) => (
                  <SplitSkillRow key={skill.id} skill={skill} />
                ))}
              </ul>
            </div>
          ))}

          <Reveal className="mt-6">
            <PlaceholderNote>
              Specific technologies, tools and libraries used in past projects
              have not been provided. Add them per category from the admin
              dashboard and they will appear here automatically.
            </PlaceholderNote>
          </Reveal>
        </div>

        {/* This site's own stack */}
        <div className="lg:col-span-6">
          <h3 className="type-mono mb-5 text-fg-muted">
            This site is built with
          </h3>

          <Stagger className="grid grid-cols-2 gap-3" step={0.06}>
            {TECH_STACK.map((item) => (
              <Card key={item.name} sweep className="flex flex-col justify-between p-5">
                <p className="font-display text-[1.05rem] leading-tight tracking-tight text-fg">
                  {item.name}
                </p>
                <p className="mt-3 text-[0.78rem] leading-snug text-fg-muted">
                  {item.role}
                </p>
              </Card>
            ))}
          </Stagger>
        </div>
      </div>
    </Section>
  );
}
