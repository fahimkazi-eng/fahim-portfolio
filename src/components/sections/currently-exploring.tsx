"use client";

import { Section, SectionHeading } from "@/components/ui/card";
import { Stagger } from "@/components/animations/motion-primitives";
import { SplitText } from "@/components/animations/split-text";

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
  return (
    <Section id="exploring">
      <SectionHeading
        index="05"
        eyebrow="Currently exploring"
        title={<SplitText text="Currently exploring." duration={1} />}
        lede="Areas I'm actively exploring and building toward as I grow as a product builder."
      />

      <Stagger className="gutter shell mt-[clamp(2rem,5vw,4rem)] grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {items.map((item) => (
          <article
            key={item.number}
            className="group flex flex-col gap-4 rounded-card border border-line bg-surface p-6 transition-colors duration-300 hover:border-accent/60"
          >
            <div className="flex items-center justify-between">
              <span className="type-mono text-accent tabular-nums">
                {item.number}
              </span>
              <span
                aria-hidden="true"
                className="h-px flex-1 ml-4 bg-line transition-colors duration-300 group-hover:bg-accent/40"
              />
            </div>
            <h3 className="type-display text-h4 tracking-tight text-fg">
              {item.title}
            </h3>
            <p className="text-sm leading-relaxed text-fg-muted">
              {item.desc}
            </p>
          </article>
        ))}
      </Stagger>
    </Section>
  );
}
