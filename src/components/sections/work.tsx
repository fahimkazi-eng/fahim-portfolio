"use client";

import { useLayoutEffect, useRef } from "react";
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
import { ProjectLoopVideo } from "./project-loop-video";

/* ==========================================================================
   Featured work

   Each panel's primary visual is the project's real demo recording, played
   silently on a loop (see ProjectLoopVideo). A project with no recording yet
   falls back to its still and then to its signature, so anything added from
   the admin appears here correctly with no code change.

   Nothing here links to a separate case-study page. "Live" and "Source" are
   the only outbound links, and each renders only when the project has a real
   URL behind it.

   Desktop: a pinned horizontal track. Each project gets a full panel, so the
              presentation stays readable instead of being crammed into a
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
          title={<SplitText text="Selected work." duration={1} />}
          lede={
            list.length
              ? `${list.length} ${list.length === 1 ? "project" : "projects"}, each with a silent looping demo of the real thing.`
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
        <ProjectLoopVideo
          src={project.videoUrl}
          poster={project.videoPosterUrl}
          stillSrc={project.imageUrl}
          title={project.title}
          slug={project.slug}
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

          {/* The only outbound links on the panel. Each renders solely when
              the project has a real URL behind it, so "Live" is never a claim
              the project cannot back up. */}
          {project.liveUrl || project.repoUrl ? (
            <div className="flex flex-wrap items-center gap-3">
              {project.liveUrl ? (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor="view"
                  className="inline-flex h-11 items-center rounded-pill bg-fg px-6 text-[0.9rem] font-medium text-canvas transition-colors duration-300 hover:bg-accent hover:text-accent-fg"
                >
                  Live
                </a>
              ) : null}
              {project.repoUrl ? (
                <a
                  href={project.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor="view"
                  className="inline-flex h-11 items-center rounded-pill border border-line-strong px-6 text-[0.9rem] text-fg transition-colors duration-300 hover:border-accent hover:text-accent"
                >
                  Source
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
