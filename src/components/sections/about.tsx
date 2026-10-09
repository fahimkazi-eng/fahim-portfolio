import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { aboutPillars, site } from "@/lib/site";
import { Section, SectionHeading } from "@/components/ui/card";
import { Reveal, Stagger } from "@/components/animations/motion-primitives";
import { SplitText } from "@/components/animations/split-text";
import { CountUp } from "@/components/animations/scroll-motion";
import { Magnetic } from "@/components/ui/magnetic";
import { Button } from "@/components/ui/button";

/* ==========================================================================
   About (02) — reference composition: large editorial statement, identity
   sheet with a cinematic editorial portrait + real facts, design statement,
   capabilities, truthful metrics strip.
   ========================================================================== */

const CAPABILITIES = [
  "Full-stack web development",
  "UI engineering",
  "Product development",
  "Systems thinking",
  "Interactive experiences",
];

/* The editorial portrait: 2:3, generated dark navy with restrained blue-violet
   light. Committed to `public/`; the path is stable. */
const ABOUT_PORTRAIT = "/portraits/about-portrait.jpg";

export function AboutSection() {
  return (
    <Section id="about">
      <SectionHeading
        index="/ 02"
        eyebrow="About"
        title={<SplitText text="About me." duration={1} />}
      />

      <div className="grid grid-cols-1 gap-[clamp(2.5rem,6vw,5rem)] lg:grid-cols-12">
        {/* ---- Left: statement ---- */}
        <div className="lg:col-span-7 lg:flex lg:flex-col">
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

          {/* CTAs — pinned to the column foot on desktop so the tall right
              portrait doesn't leave a dead zone under the text */}
          <Reveal
            delay={0.18}
            className="mt-[clamp(1.75rem,3.5vw,2.5rem)] lg:mt-auto lg:pt-[clamp(2rem,4vw,3rem)]"
          >
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
            <div className="edge-glow overflow-hidden rounded-card border border-line bg-surface-strong/60 shadow-[0_24px_70px_-40px_rgba(5,10,22,0.9)]">
              {/* Editorial portrait — the full 2:3 frame, presented large
                  and framed like a still rather than a circular badge. */}
              <div className="relative border-b border-line">
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent"
                />
                <div className="beam-ring relative aspect-[3/4] overflow-hidden sm:aspect-[4/5] lg:aspect-[3/4]">
                  <Image
                    src={ABOUT_PORTRAIT}
                    alt={site.portrait.alt}
                    fill
                    sizes="(max-width: 1023px) 92vw, 38vw"
                    quality={80}
                    className="object-cover object-[center_32%]"
                  />
                  {/* Bottom melt into the card, so the portrait sits in the
                      page rather than floating as a window. */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-[26%] bg-gradient-to-t from-canvas/85 to-transparent"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-[20%] bg-gradient-to-b from-canvas/70 to-transparent"
                  />
                  {/* Fine architectural corner ticks + technical annotations,
                      so the still reads as a framed plate rather than a crop. */}
                  <span aria-hidden="true" className="pointer-events-none absolute left-3 top-3 size-4 border-l border-t border-accent/70" />
                  <span aria-hidden="true" className="pointer-events-none absolute right-3 top-3 size-4 border-r border-t border-accent/70" />
                  <span aria-hidden="true" className="pointer-events-none absolute bottom-3 left-3 size-4 border-b border-l border-accent/70" />
                  <span aria-hidden="true" className="pointer-events-none absolute bottom-3 right-3 size-4 border-b border-r border-accent/70" />
                  <span className="type-mono pointer-events-none absolute left-7 top-3.5 text-[0.625rem] text-fg-muted">
                    Fig. 01 — Portrait
                  </span>
                  <span className="type-mono pointer-events-none absolute right-7 top-3.5 text-[0.625rem] text-fg-muted">
                    2023 — 2027
                  </span>
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10"
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
          { value: 10, suffix: "", label: "Products shipped" },
          { value: 15, suffix: "", label: "Public builds" },
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