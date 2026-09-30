import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, ArrowRight } from "lucide-react";
import type { Project } from "@/lib/db/schema";
import { Card, PlaceholderNote, Section, Tag } from "@/components/ui/card";
import { SplitText } from "@/components/animations/split-text";
import { Reveal, Stagger } from "@/components/animations/motion-primitives";
import { PageTransition } from "@/components/ui/marquee";
import { Magnetic } from "@/components/ui/magnetic";
import { ProjectFrame } from "./project-frame";
import { ProjectStage } from "./project-stage";

/* ==========================================================================
   Full case study: the Problem → Solution → Features → Implementation →
   Result narrative, expanded from the homepage teaser.

   Every field that has not been written renders as an explicit "not written
   yet" marker. A case study with gaps reads as a case study with gaps.
   ========================================================================== */

const STEPS = [
  { key: "problem", label: "Problem", index: "01" },
  { key: "solution", label: "Solution", index: "02" },
  { key: "features", label: "Features", index: "03" },
  { key: "implementation", label: "Implementation", index: "04" },
  { key: "result", label: "Result", index: "05" },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

export function CaseStudy({
  project,
  next,
}: {
  project: Project;
  next: Project | null;
}) {
  const filled = STEPS.filter(
    (step) =>
      step.key === "features"
        ? project.features.length > 0
        : Boolean(String(project[step.key as keyof Project] ?? "").trim()),
  ).length;

  return (
    <PageTransition>
      {/* ---------------- Hero ---------------- */}
      <header className="gutter shell pt-[clamp(7rem,16vw,13rem)] pb-[clamp(3rem,7vw,6rem)]">
        <Link
          href="/#work"
          className="type-mono group inline-flex items-center gap-2 text-fg-muted transition-colors duration-300 hover:text-accent"
        >
          <ArrowLeft
            className="size-3.5 transition-transform duration-300 group-hover:-translate-x-1"
            strokeWidth={2}
          />
          All work
        </Link>

        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <div className="mb-5 flex items-center gap-3">
              <span className="type-mono text-accent">Case study</span>
              <span aria-hidden="true" className="h-px w-10 bg-accent/50" />
              {project.year ? (
                <span className="type-mono text-fg-subtle">{project.year}</span>
              ) : null}
            </div>

            <h1 className="type-display text-h1 leading-[0.85] text-fg">
              <SplitText text={project.title} duration={1.2} immediate />
            </h1>

            {project.tagline ? (
              <p className="type-mono mt-5 text-fg-muted">{project.tagline}</p>
            ) : null}
          </div>

          <div className="lg:col-span-4">
            <p className="text-lead leading-relaxed text-fg-muted">
              {project.summary ?? project.tagline ?? project.title}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              {project.liveUrl ? (
                <Magnetic strength={6}>
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-11 items-center gap-2 rounded-pill bg-fg px-6 text-[0.9rem] font-medium text-canvas transition-colors duration-300 hover:bg-accent hover:text-accent-fg"
                  >
                    Live demo
                    <ArrowUpRight className="size-4" strokeWidth={2} />
                  </a>
                </Magnetic>
              ) : null}
              {project.repoUrl ? (
                <a
                  href={project.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center rounded-pill border border-line-strong px-6 text-[0.9rem] text-fg transition-colors duration-300 hover:border-accent hover:text-accent"
                >
                  Source
                </a>
              ) : null}
            </div>

            {(project.liveUrl || project.repoUrl) ? null : (
              <p className="type-mono mt-5 text-fg-subtle">
                No live URL or repository has been supplied for this project.
              </p>
            )}
          </div>
        </div>

        {/* Completion meter — honest about what is filled in. */}
        <div className="rule mt-12 flex flex-wrap items-center gap-4 pt-6">
          <span className="type-mono text-fg-subtle">
            {filled} of {STEPS.length} sections written
          </span>
          <span aria-hidden="true" className="h-px flex-1 bg-line" />
          {project.role ? (
            <span className="type-mono text-fg-muted">Role: {project.role}</span>
          ) : null}
        </div>
      </header>

      {/* ---------------- Cover ---------------- */}
      <div className="gutter shell">
        <Reveal>
          <div className="overflow-hidden rounded-card border border-line">
            <ProjectFrame
              src={project.imageUrl}
              title={project.title}
              slug={project.slug}
              className="aspect-16/10 w-full border-b-0"
              priority
            />
          </div>
        </Reveal>
      </div>

      {/* ---------------- Stage ----------------
          The second visual presentation. When a real screenshot exists the
          cover above carries it and this band is the immersive counterpart;
          when none exists the cover already shows the generative signature,
          and this band is where its metadata and technology live. Either way
          it is a different composition, not a repeat of the same image. */}
      <div className="mt-[clamp(2.5rem,6vw,5rem)]">
        <ProjectStage project={project} />
      </div>

      {/* ---------------- Narrative ---------------- */}
      <Section id="narrative">
        <ol className="space-y-[clamp(2rem,5vw,4rem)]">
          {STEPS.map((step) => (
            <li key={step.key}>
              <NarrativeBlock project={project} step={step} />
            </li>
          ))}
        </ol>
      </Section>

      {/* ---------------- Tech ---------------- */}
      {project.tech.length > 0 ? (
        <Section id="stack">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="type-mono text-accent">Technology</p>
              <h2 className="type-display mt-3 text-h2 leading-[0.9] text-fg">
                What it&apos;s built with
              </h2>
            </div>
            <Stagger className="flex flex-wrap gap-2 lg:col-span-8" step={0.04}>
              {project.tech.map((tech) => (
                <Tag key={tech} className="px-3.5 py-1.5 text-[0.8125rem]">
                  {tech}
                </Tag>
              ))}
            </Stagger>
          </div>

          {project.tech.length === 0 ? null : (
            <PlaceholderNote className="mt-8">
              Technologies listed here are the ones recorded for this project.
              The wider tooling used across the site is listed under
              Capabilities — if something was used here but is not listed, add
              it in the admin dashboard rather than assuming.
            </PlaceholderNote>
          )}
        </Section>
      ) : null}

      {/* ---------------- Gallery ---------------- */}
      {project.gallery.length > 0 ? (
        <Section id="gallery">
          <div className="mb-8 flex items-baseline gap-4">
            <p className="type-mono text-accent">Gallery</p>
            <span aria-hidden="true" className="h-px flex-1 bg-line" />
          </div>
          <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2" step={0.08}>
            {project.gallery.map((src, i) => (
              <div
                key={src}
                className={`overflow-hidden rounded-card border border-line ${
                  i === 0 ? "sm:col-span-2" : ""
                }`}
              >
                <div className="relative aspect-16/10 w-full">
                  <Image
                    src={src}
                    alt={`${project.title} screenshot ${i + 1}`}
                    fill
                    sizes={i === 0 ? "(max-width: 640px) 100vw, 90vw" : "(max-width: 640px) 100vw, 45vw"}
                    className="object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
            ))}
          </Stagger>
        </Section>
      ) : null}

      {/* ---------------- Next ---------------- */}
      {next ? (
        <Section id="next">
          <Link href={`/work/${next.slug}`} className="group block">
            <Card
              sweep
              className="flex flex-col items-start justify-between gap-6 p-[clamp(1.75rem,4vw,3.5rem)] md:flex-row md:items-center"
            >
              <div>
                <p className="type-mono text-accent">Next case study</p>
                <p className="type-display mt-3 text-h2 leading-[0.9] text-fg transition-colors duration-500 group-hover:text-accent">
                  {next.title}
                </p>
                {next.tagline ? (
                  <p className="type-mono mt-3 text-fg-muted">{next.tagline}</p>
                ) : null}
              </div>
              <span
                aria-hidden="true"
                className="inline-flex size-14 shrink-0 items-center justify-center rounded-pill border border-line-strong text-fg transition-colors duration-300 group-hover:border-accent group-hover:bg-accent group-hover:text-accent-fg"
              >
                <ArrowRight className="size-5" strokeWidth={2} />
              </span>
            </Card>
          </Link>
        </Section>
      ) : (
        <Section id="next">
          <Card sweep className="p-[clamp(1.75rem,4vw,3rem)]">
            <p className="type-mono text-accent">That&apos;s everything published</p>
            <p className="mt-3 font-display text-h3 tracking-tight text-fg">
              More case studies will appear here as they are written up.
            </p>
            <Link
              href="/#work"
              className="type-mono mt-5 inline-flex items-center gap-2 text-fg-muted transition-colors duration-300 hover:text-accent"
            >
              Back to the work
              <ArrowRight className="size-3.5" strokeWidth={2} />
            </Link>
          </Card>
        </Section>
      )}
    </PageTransition>
  );
}

/* -------------------------------------------------------------------------- */

function NarrativeBlock({
  project,
  step,
}: {
  project: Project;
  step: { key: StepKey; label: string; index: string };
}) {
  return (
    <Reveal>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-3">
          <div className="lg:sticky lg:top-28">
            <p className="type-mono text-accent tabular-nums">{step.index}</p>
            <h2 className="type-display mt-2 text-h3 leading-[0.95] text-fg">
              {step.label}
            </h2>
          </div>
        </div>

        <div className="lg:col-span-9">
          <StepBody project={project} stepKey={step.key} label={step.label} />
        </div>
      </div>
    </Reveal>
  );
}

function StepBody({
  project,
  stepKey,
  label,
}: {
  project: Project;
  stepKey: StepKey;
  label: string;
}) {
  if (stepKey === "features") {
    if (!project.features.length) {
      return <Awaiting label="Feature list not supplied" title={project.title} />;
    }
    return (
      <Stagger className="grid gap-3 sm:grid-cols-2" step={0.06}>
        {project.features.map((feature, i) => (
          <div
            key={feature}
            className="flex gap-3.5 rounded-card border border-line bg-surface p-5"
          >
            <span className="type-mono shrink-0 text-accent tabular-nums">
              {String(i + 1).padStart(2, "0")}
            </span>
            <p className="text-[0.9375rem] leading-relaxed text-fg-muted">
              {feature}
            </p>
          </div>
        ))}
      </Stagger>
    );
  }

  const value = project[stepKey];
  if (!value || !String(value).trim()) {
    return <Awaiting label={`${label} not written yet`} title={project.title} />;
  }

  return (
    <p className="max-w-[68ch] text-lead leading-[1.65] text-fg-muted">
      {value}
    </p>
  );
}

function Awaiting({ label, title }: { label: string; title: string }) {
  return (
    <div className="rounded-card border border-dashed border-accent/40 bg-accent/[0.05] p-7">
      <p className="type-mono text-accent">TBD</p>
      <p className="mt-2 max-w-[60ch] text-body leading-relaxed text-fg-muted">
        {label} for {title}. Nothing has been written here yet. Filling this in
        with plausible-sounding text would misrepresent the project, so it stays
        empty until there is something real to say.
      </p>
    </div>
  );
}
