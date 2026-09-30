"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { gsap } from "gsap";
import type { Project } from "@/lib/db/schema";
import {
  PlaceholderNote,
  Section,
  SectionHeading,
  Tag,
} from "@/components/ui/card";
import { SplitText } from "@/components/animations/split-text";
import { usePrefersReducedMotion } from "@/components/animations/motion-primitives";
import { ProjectFrame } from "./project-frame";
import { cn } from "@/lib/utils";

/* ==========================================================================
   Project storytelling

   The scrolling spine of the page. For each case study:
     a sticky media panel on one side, and a five-step narrative
     (Problem → Solution → Features → Implementation → Result) that scrolls
     past it. Each step is a ScrollTrigger that drives the media's
     scale/rotation, and a highlighted state on the step itself.

   Every step renders a visible "awaiting content" state when the field is
   empty, so an unfinished case study reads as unfinished.
   ========================================================================== */

const STEPS = [
  { key: "problem", label: "Problem", index: "01" },
  { key: "solution", label: "Solution", index: "02" },
  { key: "features", label: "Features", index: "03" },
  { key: "implementation", label: "Implementation", index: "04" },
  { key: "result", label: "Result", index: "05" },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

export function StorySection({ projects }: { projects: Project[] }) {
  const list = projects.slice(0, 2);

  return (
    <Section id="story">
      <SectionHeading
        index="04"
        eyebrow="Case studies"
        title={<SplitText text="How the work actually got built." duration={1} />}
        lede="Not a feature list. The reasoning, in order, from the problem to what came out of it."
      />

      {list.length === 0 ? (
        <PlaceholderNote>
          No published projects to walk through yet.
        </PlaceholderNote>
      ) : (
        <div className="space-y-[clamp(4rem,10vw,10rem)]">
          {list.map((project, i) => (
            <CaseStudy key={project.id} project={project} index={i} />
          ))}
        </div>
      )}
    </Section>
  );
}

function CaseStudy({ project, index }: { project: Project; index: number }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mediaRef = useRef<HTMLDivElement | null>(null);
  const reduced = usePrefersReducedMotion();

  /* One scrub for the whole case study: drives a slow push-in on the media
     plus a rotation, so the panel feels alive as the narrative scrolls. */
  useMediaScrub(ref, mediaRef, reduced);

  return (
    <div ref={ref} className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-10">
      {/* Intro header — full width above the two columns */}
      <div className="lg:col-span-12">
        <div className="rule flex flex-wrap items-baseline justify-between gap-4 pt-6">
          <div className="flex items-baseline gap-4">
            <span className="type-mono text-accent tabular-nums">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="type-display text-h2 leading-[0.9] text-fg">
              {project.title}
            </h3>
            {project.tagline ? (
              <span className="type-mono text-fg-muted">{project.tagline}</span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {project.liveUrl ? (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="type-mono text-fg-muted transition-colors duration-300 hover:text-accent"
              >
                Live ↗
              </a>
            ) : null}
            {project.repoUrl ? (
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="type-mono text-fg-muted transition-colors duration-300 hover:text-accent"
              >
                Source ↗
              </a>
            ) : null}
            <Link
              href={`/work/${project.slug}`}
              className="group type-mono inline-flex items-center gap-1.5 text-fg transition-colors duration-300 hover:text-accent"
            >
              Full case study
              <ArrowUpRight
                className="size-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                strokeWidth={2}
              />
            </Link>
          </div>
        </div>

        {project.tech.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {project.tech.map((tech) => (
              <li key={tech}>
                <Tag>{tech}</Tag>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {/* Sticky media */}
      <div className="lg:col-span-6">
        <div className="sticky top-28">
          <div
            ref={mediaRef}
            className="overflow-hidden rounded-card border border-line"
          >
            <ProjectFrame
              src={project.imageUrl}
              title={project.title}
              slug={project.slug}
              className="aspect-4/3 w-full border-b-0 lg:aspect-16/10"
            />
          </div>

          {project.year || project.role ? (
            <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line">
              {project.year ? (
                <div className="bg-canvas p-4">
                  <dt className="type-mono text-fg-subtle">Year</dt>
                  <dd className="mt-1 text-body text-fg">{project.year}</dd>
                </div>
              ) : null}
              {project.role ? (
                <div className="bg-canvas p-4">
                  <dt className="type-mono text-fg-subtle">Role</dt>
                  <dd className="mt-1 text-body text-fg">{project.role}</dd>
                </div>
              ) : null}
            </dl>
          ) : null}
        </div>
      </div>

      {/* Narrative steps */}
      <div className="lg:col-span-6">
        <ol className="space-y-3">
          {STEPS.map((step) => (
            <NarrativeStep
              key={step.key}
              project={project}
              stepKey={step.key}
              index={step.index}
              label={step.label}
            />
          ))}
        </ol>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------
   One narrative step
   -------------------------------------------------------------------------- */

function NarrativeStep({
  project,
  stepKey,
  index,
  label,
}: {
  project: Project;
  stepKey: StepKey;
  index: string;
  label: string;
}) {
  const ref = useRef<HTMLLIElement | null>(null);
  const reduced = usePrefersReducedMotion();

  useNarrativeStep(ref, reduced);

  return (
    <li
      ref={ref}
      data-step="false"
      className={cn(
        "group relative rounded-card border border-line bg-surface p-5 transition-colors duration-500 sm:p-7",
        "data-[step=true]:border-accent/45 data-[step=true]:bg-accent/[0.035]",
      )}
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-3 left-0 w-px origin-top scale-y-0 bg-accent transition-transform duration-500 ease-out group-data-[step=true]:scale-y-100"
      />
      <div className="mb-3 flex items-center gap-3">
        <span className="type-mono text-accent tabular-nums">{index}</span>
        <h4 className="type-mono text-fg">{label}</h4>
      </div>

      <StepBody project={project} stepKey={stepKey} />
    </li>
  );
}

function StepBody({
  project,
  stepKey,
}: {
  project: Project;
  stepKey: StepKey;
}) {
  if (stepKey === "features") {
    if (!project.features.length) {
      return (
        <Awaiting label="Feature list not supplied" project={project.title} />
      );
    }
    return (
      <ul className="grid gap-2 sm:grid-cols-2">
        {project.features.map((feature) => (
          <li
            key={feature}
            className="flex gap-2.5 text-[0.875rem] leading-relaxed text-fg-muted"
          >
            <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-accent" />
            {feature}
          </li>
        ))}
      </ul>
    );
  }

  const value = project[stepKey];
  if (!value || !String(value).trim()) {
    return <Awaiting label={`${labelFor(stepKey)} not written yet`} project={project.title} />;
  }

  return (
    <p className="max-w-[54ch] text-[0.95rem] leading-relaxed text-fg-muted">
      {value}
    </p>
  );
}

function labelFor(key: StepKey) {
  return STEPS.find((s) => s.key === key)?.label ?? key;
}

function Awaiting({ label, project }: { label: string; project: string }) {
  return (
    <p className="flex items-start gap-2.5 rounded-lg border border-dashed border-accent/40 bg-accent/[0.05] px-3.5 py-3 text-[0.8125rem] leading-relaxed text-fg-muted">
      <span aria-hidden="true" className="type-mono mt-px shrink-0 text-accent">
        TBD
      </span>
      <span>
        {label} for {project}. Nothing has been written here yet, because
        inventing a problem or a result would misrepresent the project.
      </span>
    </p>
  );
}

/* --------------------------------------------------------------------------
   Effects
   -------------------------------------------------------------------------- */

/** Slow push-in on the sticky media, scrubbed across the whole case study. */
function useMediaScrub(
  root: React.RefObject<HTMLDivElement | null>,
  media: React.RefObject<HTMLDivElement | null>,
  reduced: boolean,
) {
  useLayoutEffect(() => {
    const section = root.current;
    const panel = media.current;
    if (!section || !panel || reduced) return;

    const tween = gsap.fromTo(
      panel,
      { scale: 0.94, rotate: -0.6 },
      {
        scale: 1.03,
        rotate: 0.4,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top 70%",
          end: "bottom bottom",
          scrub: 0.8,
        },
      },
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      gsap.set(panel, { clearProps: "transform" });
    };
  }, [root, media, reduced]);
}

/** Highlights a step while it is the one being read. */
function useNarrativeStep(
  ref: React.RefObject<HTMLLIElement | null>,
  reduced: boolean,
) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Runs in both cases: the highlight is a colour/border change, not
    // motion, so it stays useful when animation is reduced.
    void reduced;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          (entry.target as HTMLElement).dataset.step = entry.isIntersecting
            ? "true"
            : "false";
        }
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: 0 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, reduced]);
}
