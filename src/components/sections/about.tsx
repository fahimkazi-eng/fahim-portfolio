import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { aboutPillars, site } from "@/lib/site";
import { Section, SectionHeading } from "@/components/ui/card";
import { Reveal, Stagger } from "@/components/animations/motion-primitives";
import { SplitText } from "@/components/animations/split-text";
import { CountUp } from "@/components/animations/scroll-motion";
import { Portrait } from "@/components/ui/portrait";
import { Magnetic } from "@/components/ui/magnetic";
import { Button } from "@/components/ui/button";

/* ==========================================================================
   About (02) — reference composition: large editorial statement, identity
   sheet with portrait + real facts, design statement, capabilities,
   truthful metrics strip.
   ========================================================================== */

const CAPABILITIES = [
  "Full-stack web development",
  "UI engineering",
  "Product development",
  "Systems thinking",
  "Interactive experiences",
];

export function AboutSection({
  portraitSrc,
  projectCount,
}: {
  portraitSrc: string | null;
  projectCount: number;
}) {
  return (
    <Section id="about">
      <SectionHeading
        index="/ 02"
        eyebrow="About"
        title={<SplitText text="About me." duration={1} />}
      />

      <div className="grid grid-cols-1 gap-[clamp(2.5rem,6vw,5rem)] lg:grid-cols-12">
        {/* ---- Left: statement ---- */}
        <div className="lg:col-span-7">
          <Reveal>
            <p className="font-display text-[clamp(1.75rem,1.35rem+2vw,3.1rem)] font-semibold leading-[1.04] tracking-[-0.02em] text-fg">
              A CSE student turned product builder, focused on creating
              meaningful digital experiences.
            </p>
          </Reveal>

          <div className="mt-[clamp(1.75rem,3.5vw,2.75rem)] max-w-[60ch] space-y-5 text-lead text-fg-muted">
            {site.bio.map((paragraph, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <p>{paragraph}</p>
              </Reveal>
            ))}
          </div>

          {/* Design statement plate */}
          <Reveal delay={0.12} className="mt-[clamp(2rem,4vw,3rem)]">
            <div className="relative rounded-card border border-line bg-surface-strong/60 px-6 py-6">
              <span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 w-[3px] rounded-l-card bg-accent"
              />
              <p className="type-mono text-fg-subtle">Design statement</p>
              <p className="mt-2 font-display text-[clamp(1.5rem,1.15rem+1.6vw,2.4rem)] font-semibold leading-[0.98] tracking-[-0.02em] text-fg">
                Engineer first.
                <br />
                <span className="text-accent">Product-minded second.</span>
              </p>
            </div>
          </Reveal>

          {/* CTAs */}
          <Reveal delay={0.18} className="mt-[clamp(1.75rem,3.5vw,2.5rem)]">
            <div className="flex flex-wrap items-center gap-3">
              <Magnetic strength={8}>
                <Button asChild size="lg" variant="accent">
                  <a href="#journey">
                    My journey
                    <ArrowDownRight className="size-4" strokeWidth={2} />
                  </a>
                </Button>
              </Magnetic>
              <Magnetic strength={8}>
                <Button asChild size="lg" variant="outline">
                  <a href={`mailto:${site.email}?subject=Resume%20request`}>
                    Download resume
                    <ArrowUpRight className="size-4" strokeWidth={2} />
                  </a>
                </Button>
              </Magnetic>
            </div>
          </Reveal>
        </div>

        {/* ---- Right: identity sheet ---- */}
        <div className="lg:col-span-5">
          <Reveal delay={0.1}>
            <div className="overflow-hidden rounded-card border border-line bg-surface-strong/60">
              {/* Portrait (monogram fallback until a real photo is added) */}
              <div className="relative border-b border-line p-6">
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent"
                />
                <div className="mx-auto max-w-[15rem]">
                  <Portrait
                    src={portraitSrc}
                    alt={site.portrait.alt}
                    size={1024}
                    sizes="(max-width: 640px) 70vw, 15rem"
                    className="w-full rounded-card ring-1 ring-accent/25"
                  />
                </div>
              </div>

              {/* Facts */}
              <div className="p-6">
                <p className="font-display text-h4 tracking-tight text-fg">
                  {site.name}
                </p>
                <p className="type-mono mt-1 text-accent">
                  CSE student · Product builder
                </p>

                <dl className="mt-5 divide-y divide-line border-t border-line">
                  <FactRow label="University" value={site.university} />
                  <FactRow label="Degree" value={site.degree} />
                  <FactRow label="Years" value="2023 — 2027" />
                  <FactRow label="Location" value={site.location} />
                </dl>

                {/* Capabilities */}
                <p className="type-mono mt-6 text-fg-subtle">Capabilities</p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {CAPABILITIES.map((cap) => (
                    <li
                      key={cap}
                      className="type-mono rounded-pill border border-line px-2.5 py-1 text-fg-muted"
                    >
                      {cap}
                    </li>
                  ))}
                </ul>

                {/* Pillars as mono rows */}
                <p className="type-mono mt-6 text-fg-subtle">How I work</p>
                <ul className="mt-3 space-y-3">
                  {aboutPillars.map((pillar) => (
                    <li key={pillar.title} className="flex gap-3">
                      <span
                        aria-hidden="true"
                        className="mt-2 size-1 shrink-0 rounded-full bg-accent"
                      />
                      <p className="text-[0.875rem] leading-relaxed text-fg-muted">
                        <span className="text-fg">{pillar.title}</span>
                        {" — "}
                        {pillar.body}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      {/* ---- Truthful metrics strip ---- */}
      <Stagger
        step={0.08}
        className="mt-[clamp(3rem,7vw,5.5rem)] grid grid-cols-2 gap-px overflow-hidden rounded-card border border-line bg-line md:grid-cols-4"
      >
        {[
          { value: projectCount, suffix: "", label: "Products shipped" },
          { value: 8, suffix: "", label: "Public builds" },
          { value: site.languages.length, suffix: "", label: "Languages spoken" },
          { value: CAPABILITIES.length, suffix: "", label: "Capabilities" },
        ].map((stat) => (
          <div key={stat.label} className="bg-canvas p-6">
            <p className="type-display text-h1 leading-none text-fg">
              <CountUp to={stat.value} suffix={stat.suffix} />
            </p>
            <p className="mt-2 text-[0.8125rem] leading-snug text-fg-muted">
              {stat.label}
            </p>
          </div>
        ))}
      </Stagger>
    </Section>
  );
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="type-mono shrink-0 text-fg-subtle">{label}</dt>
      <dd className="text-right text-[0.85rem] text-fg">{value}</dd>
    </div>
  );
}