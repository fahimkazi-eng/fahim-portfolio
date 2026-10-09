import type { Service } from "@/lib/db/schema";
import { buildStages } from "@/lib/site";
import {
  Card,
  PlaceholderNote,
  Section,
  SectionHeading,
} from "@/components/ui/card";
import { Reveal, Stagger } from "@/components/animations/motion-primitives";
import { ProcessProgress } from "./process-progress";
import { SplitText } from "@/components/animations/split-text";
import { Spotlight, Tilt } from "@/components/ui/magnetic";
import { CountUp } from "@/components/animations/scroll-motion";

/* ==========================================================================
   How I Build (08) — reference composition.

   The opening is the six-step process (IDEA → RESEARCH → DESIGN →
   ENGINEERING → TEST → SHIP), rendered as an editorial strip that activates
   on scroll. Beneath it sits the real, admin-editable service list ("what I
   build"), then the availability closer. The nav item "Services" lands here.
   ========================================================================== */

export function ServicesSection({ services }: { services: Service[] }) {
  return (
    <Section id="build">
      <SectionHeading
        index="/ 08"
        eyebrow="How I build"
        title={<SplitText text="From idea to shipped." duration={1} />}
        lede="A repeatable process, not a vibe. Six steps, each with a concrete exit condition, from the first sketch to the day it ships."
      />

      {/* ---- process strip ---- */}
      <ProcessProgress stages={buildStages}>
      <Stagger
        as="ol"
        step={0.09}
        className="grid grid-cols-1 gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2 lg:grid-cols-6"
      >
        {buildStages.map((stage) => (
          <li
            key={stage.index}
            className="group flex min-h-[13rem] flex-col justify-between gap-10 bg-surface p-6 transition-colors duration-500 hover:bg-surface-strong"
          >
            <div className="flex items-center justify-between">
              <span className="type-mono text-[0.6875rem] text-fg-subtle">
                {stage.index}
              </span>
              <span
                aria-hidden="true"
                className="h-px w-6 bg-line transition-colors duration-500 group-hover:bg-accent/60"
              />
            </div>
            <div>
              <h3 className="type-mono text-[0.8125rem] uppercase tracking-[0.14em] text-fg">
                {stage.label}
              </h3>
              <p className="mt-3 max-w-[24ch] text-sm leading-relaxed text-fg-muted">
                {stage.body}
              </p>
            </div>
          </li>
        ))}
      </Stagger>
      </ProcessProgress>

      {/* ---- services from the database ---- */}
      <div className="mt-[clamp(2.5rem,5vw,4rem)]">
        <div className="mb-6 flex items-center gap-3">
          <span className="type-mono text-accent tabular-nums">——</span>
          <span className="type-mono text-fg-muted">What I build</span>
          <span aria-hidden="true" className="h-px flex-1 bg-line-strong" />
        </div>

        {services.length > 0 ? (
          <Stagger className="grid grid-cols-1 gap-4 md:grid-cols-3" step={0.09}>
            {services.map((service, i) => (
              <Tilt key={service.id} max={3.5} className="h-full">
                <Spotlight radius={340} className="h-full rounded-card">
                  {/* surface={false}: the spotlight wrapper supplies the fill so
                      the glow is not painted over by an opaque card. */}
                  <Card sweep surface={false} className="flex h-full flex-col p-7">
                    <div className="mb-6 flex items-center justify-between">
                      <span className="type-mono text-accent tabular-nums">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span
                        aria-hidden="true"
                        className="size-1.5 rounded-full bg-accent/60"
                      />
                    </div>

                    <h3 className="font-display text-h3 leading-[1.05] tracking-tight text-fg">
                      {service.title}
                    </h3>

                    <p className="mt-4 flex-1 text-body leading-relaxed text-fg-muted">
                      {service.description}
                    </p>

                    {service.deliverables.length > 0 ? (
                      <ul className="mt-7 space-y-2 border-t border-line pt-5">
                        {service.deliverables.map((item) => (
                          <li
                            key={item}
                            className="type-mono flex items-center gap-2.5 text-fg-subtle"
                          >
                            <span
                              aria-hidden="true"
                              className="h-px w-3 shrink-0 bg-accent/60"
                            />
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </Card>
                </Spotlight>
              </Tilt>
            ))}
          </Stagger>
        ) : (
          <PlaceholderNote>
            No services added yet. Add one from the admin dashboard and it will
            appear here.
          </PlaceholderNote>
        )}
      </div>

      {/* Availability strip — closes the section with a concrete next step. */}
      <Reveal className="mt-4">
        <Card
          sweep
          className="flex flex-col items-start justify-between gap-6 overflow-hidden p-7 md:flex-row md:items-center"
        >
          <div>
            <p className="type-mono text-accent">Availability</p>
            <p className="mt-2 font-display text-h3 tracking-tight text-fg">
              {`Currently ${"open to work"}.`}
            </p>
            <p className="mt-2 max-w-[46ch] text-body text-fg-muted">
              Internships, freelance builds and collaboration on student
              projects — the fastest way to start is a message.
            </p>
          </div>

          <div className="flex items-center gap-8">
            <div>
              <p className="type-display text-h3 leading-none text-fg">
                <CountUp to={2027} />
              </p>
              <p className="type-mono mt-1.5 text-fg-subtle">Graduation</p>
            </div>
            <a
              href="#contact"
              className="group inline-flex h-12 items-center rounded-pill bg-accent px-7 text-[0.9rem] font-medium text-accent-fg transition-[filter] duration-300 hover:brightness-110"
            >
              Get in touch
              <span
                aria-hidden="true"
                className="ml-0.5 transition-transform duration-300 group-hover:translate-x-1"
              >
                →
              </span>
            </a>
          </div>
        </Card>
      </Reveal>
    </Section>
  );
}