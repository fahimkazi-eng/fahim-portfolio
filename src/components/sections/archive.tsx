"use client";

import { useEffect, useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import type { Project } from "@/lib/db/schema";
import { PROJECT_CATEGORIES } from "@/lib/project-categories";
import {
  PlaceholderNote,
  Section,
  SectionHeading,
  Tag,
} from "@/components/ui/card";
import { SplitText } from "@/components/animations/split-text";
import { cn } from "@/lib/utils";
import { ProjectLoopVideo } from "./project-loop-video";

/* ==========================================================================
   More builds (09) — the archive.

   Everything published but not in the featured grid lives here, in a
   horizontal track: drag on desktop, native swipe on mobile, one-liner
   cards that lead with a signature tile (or a still/demo when present).

   The track stays native (overflow + scroll-snap) so touch users get the
   gesture the browser already does well, and keyboard users focus real
   links. Drag-to-scroll is added only for fine pointers.
   ========================================================================== */

/** Pointer-drag scrolling for fine pointers; coarse pointers keep native
    swipe so the browser's momentum handles the gesture. */
function useDragScroll<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const track = ref.current;
    if (!track) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let down = false;
    let startX = 0;
    let startLeft = 0;
    let travelled = 0;

    const onDown = (e: PointerEvent) => {
      down = true;
      travelled = 0;
      startX = e.clientX;
      startLeft = track.scrollLeft;
      try {
        track.setPointerCapture(e.pointerId);
      } catch {
        /* pointer already released */
      }
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - startX;
      travelled += Math.abs(dx);
      if (travelled > 5) {
        track.classList.add("cursor-grabbing");
        track.classList.remove("cursor-grab");
      }
      track.scrollLeft = startLeft - dx;
    };
    const onUp = () => {
      down = false;
      track.classList.add("cursor-grab");
      track.classList.remove("cursor-grabbing");
    };

    track.classList.add("cursor-grab");
    track.addEventListener("pointerdown", onDown);
    track.addEventListener("pointermove", onMove);
    track.addEventListener("pointerup", onUp);
    track.addEventListener("pointercancel", onUp);
    return () => {
      track.removeEventListener("pointerdown", onDown);
      track.removeEventListener("pointermove", onMove);
      track.removeEventListener("pointerup", onUp);
      track.removeEventListener("pointercancel", onUp);
    };
  }, []);

  return ref;
}

export function ArchiveSection({ projects }: { projects: Project[] }) {
  const archive = projects
    .filter((p) => p.published && !p.featured)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const trackRef = useDragScroll<HTMLDivElement>();

  return (
    <Section id="archive">
      <SectionHeading
        index="/ 09"
        eyebrow="More builds"
        title={<SplitText text="The archive." duration={1} />}
        lede="Student projects and prototypes that shipped to GitHub — the earlier entries on the way to the featured three."
      />

      {archive.length === 0 ? (
        <PlaceholderNote>
          No archived builds yet. Publish a project without “Featured” from the
          admin dashboard and it will appear here.
        </PlaceholderNote>
      ) : (
        <div className="relative">
          {/* edge fades hint there is more off-screen */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-canvas to-transparent"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-canvas to-transparent"
          />

          <div
            ref={trackRef}
            className="flex gap-4 overflow-x-auto pb-2 pt-1 select-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {archive.map((project, i) => (
              <ArchiveCard key={project.id} project={project} index={i} />
            ))}
          </div>

          <p className="type-mono mt-4 text-[0.6875rem] text-fg-subtle">
            drag / swipe to explore — every card links out
          </p>
        </div>
      )}
    </Section>
  );
}

function ArchiveCard({ project, index }: { project: Project; index: number }) {
  const categoryLabel =
    PROJECT_CATEGORIES.find((c) => c.value === project.category)?.label ??
    project.category;

  /* Archive rows are prototypes and student builds: prefer the source over an
     empty case study. Fall back to the case study when there is no repo. */
  const href = project.repoUrl || `/work/${project.slug}`;
  const external = Boolean(project.repoUrl);

  return (
    <article className="group flex w-[min(82vw,21rem)] shrink-0 snap-start flex-col overflow-hidden rounded-card border border-line bg-surface transition-colors duration-500 hover:border-accent/50">
      <ProjectLoopVideo
        src={undefined}
        poster={undefined}
        stillSrc={undefined}
        title={project.title}
        slug={project.slug}
        className="aspect-[16/9] w-full"
      />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-3">
          <span className="type-mono text-accent tabular-nums">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span aria-hidden="true" className="h-px flex-1 bg-line group-hover:bg-accent/40" />
          <span className="type-mono text-fg-subtle">{categoryLabel}</span>
        </div>

        <h3 className="type-display mt-3 text-h4 tracking-tight text-fg">
          {project.title}
        </h3>

        {project.summary ? (
          <p className="mt-2.5 max-w-[44ch] text-sm leading-relaxed text-fg-muted">
            {project.summary}
          </p>
        ) : (
          <p className="mt-2.5 text-sm text-fg-subtle">
            Public prototype on GitHub — details added over time.
          </p>
        )}

        {project.tech.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {project.tech.slice(0, 4).map((tech) => (
              <li key={tech}>
                <Tag>{tech}</Tag>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
          <span className="type-mono text-[0.6875rem] text-fg-subtle">
            {external ? "Source" : "Case study"}
          </span>
          <a
            href={href}
            target={external ? "_blank" : undefined}
            rel={external ? "noreferrer" : undefined}
            data-cursor="view"
            className="inline-flex items-center gap-1.5 text-[0.875rem] font-medium text-fg transition-colors duration-300 hover:text-accent"
          >
            {external ? "View source" : "View project"}
            <ArrowUpRight
              className={cn(
                "size-4 transition-transform duration-300",
                external
                  ? "group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  : "group-hover:translate-x-0.5",
              )}
              strokeWidth={2}
            />
          </a>
        </div>
      </div>
    </article>
  );
}