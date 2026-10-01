import { ArrowUpRight } from "lucide-react";
import { aboutPillars, site } from "@/lib/site";
import { Card, Section, SectionHeading } from "@/components/ui/card";
import { Reveal, Stagger } from "@/components/animations/motion-primitives";
import { SplitText } from "@/components/animations/split-text";
import { CountUp } from "@/components/animations/scroll-motion";
import { Icon } from "@/components/ui/icon";
import { Marquee } from "@/components/ui/marquee";

export function AboutSection() {
  return (
    <Section id="about">
      <div className="grid grid-cols-1 gap-[clamp(2.5rem,6vw,6rem)] lg:grid-cols-12">
        {/* Left — statement */}
        <div className="lg:col-span-7">
          <SectionHeading
            index="01"
            eyebrow="About"
            title={
              <SplitText
                text="Engineer first. Product-minded second."
                duration={1}
              />
            }
          />

          <div className="max-w-[60ch] space-y-5 text-lead text-fg-muted">
            {site.bio.map((paragraph, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <p>{paragraph}</p>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.1} className="mt-9">
            <a
              href="#contact"
              className="group inline-flex items-center gap-2 border-b border-line-strong pb-1 text-body text-fg transition-colors duration-300 hover:border-accent hover:text-accent"
            >
              Start a conversation
              <ArrowUpRight
                className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                strokeWidth={1.75}
              />
            </a>
          </Reveal>
        </div>

        {/* Right — pillars */}
        <Stagger className="space-y-3 lg:col-span-5" step={0.1}>
          {aboutPillars.map((pillar) => (
            <Card key={pillar.title} sweep className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-full border border-line text-accent">
                  <Icon name={pillar.icon} className="size-4" strokeWidth={1.75} />
                </span>
                <h3 className="font-display text-h4 tracking-tight text-fg">
                  {pillar.title}
                </h3>
              </div>
              <p className="text-body leading-relaxed text-fg-muted">
                {pillar.body}
              </p>
            </Card>
          ))}
        </Stagger>
      </div>

      {/* Numbers + languages */}
      <div className="mt-[clamp(3rem,7vw,6rem)] grid grid-cols-2 gap-px overflow-hidden rounded-card border border-line bg-line md:grid-cols-4">
        {[
          { value: 4, suffix: "", label: "Years in software & service work" },
          { value: 10, suffix: "+", label: "Platforms built" },
          { value: 7, suffix: "", label: "Core professional strengths" },
          { value: 3, suffix: "", label: "Languages spoken" },
        ].map((stat, i) => (
          <Reveal key={stat.label} delay={i * 0.06} className="bg-canvas p-6">
            <p className="type-display text-h1 leading-none text-fg">
              <CountUp to={stat.value} suffix={stat.suffix} />
            </p>
            <p className="mt-2 text-[0.8125rem] leading-snug text-fg-muted">
              {stat.label}
            </p>
          </Reveal>
        ))}
      </div>

      <div className="mt-6">
        <Marquee speed={40} className="border-y border-line py-3" separator="·">
          {site.languages.map((lang) => (
            <span key={lang} className="type-mono whitespace-nowrap text-fg-subtle">
              {lang}
            </span>
          ))}
          {site.languages.map((lang) => (
            <span key={`b-${lang}`} className="type-mono whitespace-nowrap text-fg-accent/0">
              {lang}
            </span>
          ))}
        </Marquee>
      </div>

      </Section>
  );
}
