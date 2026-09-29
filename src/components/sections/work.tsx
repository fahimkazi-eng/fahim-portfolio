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
import { HorizontalScroll } from "@/components/animations/scroll-motion";
import { usePrefersReducedMotion } from "@/components/animations/motion-primitives";
import { ProjectFrame } from "./project-frame";

/* ==========================================================================
   Featured work

   Desktop: a pinned horizontal track. Each case study gets a full panel, so
             the storytelling stays readable instead of being crammed into a
             narrow column.
   Mobile:   native vertical stack. Turning a vertical gesture into
             horizontal movement is where these sections usually become
             unusable, so pinning is never enabled on coarse pointers.
   ========================================================================== */

export function WorkSection({ projects }: { projects: Project[] }) {
  const featured = projects.filter((p) => p.featured);
  const list = featured.length ? featured : projects;

  return (
    <Section id="work" className="overflow-hidden">
      <div className="gutter shell">
        <SectionHeading
          index="03"
          eyebrow="Selected work"
          title={<SplitText text="Two platforms, built properly." duration={1} />}
          lede={
            list.length
              ? "Case studies, structured the way I actually build: problem, solution, features, implementation, result."
              : undefined
          }
        />
      </div>

      {list.length === 0 ? (
        <div className="gutter shell">
          <PlaceholderNote>
            No published projects yet. Add one from the admin dashboard and it
            will appear here.
          </PlaceholderNote>
        </div>
      ) : (
        <HorizontalScroll
          className="mt-2"
          trackClassName="items-stretch gap-4 px-[clamp(1.15rem,0.6rem+2.6vw,4.5rem)]"
        >
          {list.map((project, i) => (
            <ProjectPanel key={project.id} project={project} index={i} />
          ))}

          {/* Trailing card so the track never ends on a hard edge. */}
          <div className="flex w-[min(86vw,24rem)] shrink-0 items-center justify-center rounded-card border border-dashed border-line-strong p-8">
            <p className="type-mono text-center text-fg-subtle">
              More in progress
            </p>
          </div>
        </HorizontalScroll>
      )}
    </Section>
  );
}

/* --------------------------------------------------------------------------
   One panel
   -------------------------------------------------------------------------- */

function ProjectPanel({
  project,
  index,
}: {
  project: Project;
  index: number;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const reduced = usePrefersReducedMotion();

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;

    // Plain transition rather than a ScrollTrigger: the element is already
    // inside a horizontally-scrubbed track, and adding a second trigger on
    // the same element would fight the pin.
    const tween = gsap.fromTo(
      el,
      { autoAlpha: 0, y: 28 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.8,
        ease: "expo.out",
        scrollTrigger: {
          trigger: el,
          containerAnimation: undefined,
          start: "left 92%",
          once: true,
        },
        onComplete: () => gsap.set(el, { clearProps: "transform,opacity,visibility" }),
      },
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [reduced]);

  return (
    <article
      ref={ref}
      className="flex w-[min(88vw,60rem)] shrink-0 flex-col overflow-hidden rounded-card border border-line bg-surface lg:w-[min(86vw,66rem)]"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12">
        <ProjectFrame
          src={project.imageUrl}
          title={project.title}
          className="h-[clamp(15rem,42vw,28rem)] w-full lg:col-span-7"
        />

        <div className="flex flex-col justify-between gap-7 p-[clamp(1.5rem,3vw,2.75rem)] lg:col-span-5">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="type-mono text-accent tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              {project.year ? (
                <span className="type-mono text-fg-subtle">{project.year}</span>
              ) : null}
            </div>

            <h3 className="type-display text-h2 leading-[0.9] text-fg">
              {project.title}
            </h3>

            {project.tagline ? (
              <p className="type-mono mt-3 text-fg-muted">{project.tagline}</p>
            ) : null}

            {project.summary ? (
              <p className="mt-5 max-w-[46ch] text-body leading-relaxed text-fg-muted">
                {project.summary}
              </p>
            ) : null}

            {project.tech.length > 0 ? (
              <ul className="mt-6 flex flex-wrap gap-2">
                {project.tech.map((tech) => (
                  <li key={tech}>
                    <Tag>{tech}</Tag>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/work/${project.slug}`}
              className="group inline-flex h-11 items-center gap-2.5 rounded-pill bg-fg px-6 text-[0.9rem] font-medium text-canvas transition-colors duration-300 hover:bg-accent hover:text-accent-fg"
            >
              Read case study
              <ArrowUpRight
                className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                strokeWidth={2}
              />
            </Link>
            {project.liveUrl ? (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center rounded-pill border border-line-strong px-6 text-[0.9rem] text-fg transition-colors duration-300 hover:border-accent hover:text-accent"
              >
                Live demo
              </a>
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
        </div>
      </div>
    </article>
  );
}
