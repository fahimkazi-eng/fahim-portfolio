"use client";

import { useRef, useState } from "react";
import { Section, SectionHeading } from "@/components/ui/card";
import { Stagger } from "@/components/animations/motion-primitives";
import { SplitText } from "@/components/animations/split-text";
import { usePrefersReducedMotion } from "@/components/animations/motion-primitives";

const experiments = [
  {
    number: "01",
    title: "Magnetic Button",
    desc: "Subtle attraction effect on hover for call-to-actions.",
  },
  {
    number: "02",
    title: "Text Distortion",
    desc: "Glyph-based hover distortion using CSS/GSAP-lite ideas.",
  },
  {
    number: "03",
    title: "Cursor Trail",
    desc: "Lightweight pointer-following particles, disabled on touch/reduced motion.",
  },
  {
    number: "04",
    title: "Aurora Field",
    desc: "Subtle animated gradients driven by time, throttled on mobile.",
  },
  {
    number: "05",
    title: "Particle Field",
    desc: "Canvas particle field with low particle count and DPR clamping.",
  },
  {
    number: "06",
    title: "Scroll Typography",
    desc: "Scroll-linked text reveal with minimal transforms.",
  },
  {
    number: "07",
    title: "Hover Physics",
    desc: "Spring-based hover scale with single rAF loop.",
  },
  {
    number: "08",
    title: "Micro Interaction",
    desc: "Button press feedback with composited transforms.",
  },
];

function ExperimentCard({ exp }: { exp: typeof experiments[0] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const reduced = usePrefersReducedMotion();

  return (
    <article
      ref={ref}
      className="group relative flex flex-col gap-4 rounded-card border border-line bg-surface p-6 transition-colors duration-300 hover:border-accent/60"
      onMouseEnter={() => !reduced && setActive(true)}
      onMouseLeave={() => setActive(false)}
      onFocus={() => !reduced && setActive(true)}
      onBlur={() => setActive(false)}
      tabIndex={0}
      role="button"
      aria-label={`${exp.title} experiment`}
    >
      <div className="flex items-center justify-between">
        <span className="type-mono text-accent tabular-nums">{exp.number}</span>
        <span
          aria-hidden="true"
          className="ml-4 h-px flex-1 bg-line transition-colors duration-300 group-hover:bg-accent/40"
        />
      </div>
      <h3 className="type-display text-h4 tracking-tight text-fg">{exp.title}</h3>
      <p className="text-sm leading-relaxed text-fg-muted">{exp.desc}</p>
      <div className="mt-auto flex items-center gap-2">
        <span className="type-mono text-xs text-fg-subtle">
          {reduced ? "Reduced motion" : active ? "Interactive" : "Hover to preview"}
        </span>
      </div>
    </article>
  );
}

export function PlaygroundSection() {
  return (
    <Section id="playground">
      <SectionHeading
        index="06"
        eyebrow="Playground"
        title={<SplitText text="Tiny experiments." duration={1} />}
        lede="A small lab of lightweight, isolated micro-interactions and creative bits."
      />

      <Stagger className="gutter shell mt-[clamp(2rem,5vw,4rem)] grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {experiments.map((exp) => (
          <ExperimentCard key={exp.number} exp={exp} />
        ))}
      </Stagger>
    </Section>
  );
}
