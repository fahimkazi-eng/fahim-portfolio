"use client";

import { useMemo, useState } from "react";
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
import { Stagger } from "@/components/animations/motion-primitives";
import { cn } from "@/lib/utils";
import { ProjectLoopVideo } from "./project-loop-video";

/* ==========================================================================
   Featured work (04) — reference composition.

   A filter pill row (ALL + the categories that actually have projects) over
   a premium editorial grid. Each card is numbered, states its category, and
   leads with the project's real demo recording (still fallback) before the
   title, description, stack, status and a single "View project" action.

   Status is never claimed — it is derived from real fields:
     liveUrl present -> LIVE      repoUrl present -> SOURCE
     neither present -> no status chip at all (nothing fabricated).
   ========================================================================== */

type FilterKey = "all" | (typeof PROJECT_CATEGORIES)[number]["value"];

export function WorkSection({ projects }: { projects: Project[] }) {
  const published = projects.filter((p) => p.published);
  const featured = published.filter((p) => p.featured);
  const list = featured.length ? featured : published;

  const [filter, setFilter] = useState<FilterKey>("all");

  /* Pills only for categories that have a project *in the grid* — a filter
     with nothing behind it is a dead control. Deriving from `list` (not the
     wider published set) keeps every visible pill from ever reading 00, and
     the reference row reads correctly: ALL / WEB APP / SAAS / E-COMMERCE /
     EXPERIMENT. */
  const present = useMemo(() => {
    const used = new Set(list.map((p) => p.category));
    return PROJECT_CATEGORIES.filter((c) => used.has(c.value as FilterKey));
  }, [list]);

  const visible = useMemo(
    () =>
      filter === "all"
        ? list
        : list.filter((p) => p.category === filter),
    [filter, list],
  );

  return (
    <Section id="work">
      <div className="gutter shell">
        <SectionHeading
          index="/ 04"
          eyebrow="Featured work"
          title={<SplitText text="Selected work." duration={1} />}
          lede={
            list.length
              ? `Real products, each with its own silent looping demo of the thing actually running — not a mock-up.`
              : undefined
          }
        />
      </div>

      {/* ---- filter pills ---- */}
      <div
        role="group"
        aria-label="Filter projects by category"
        className="flex flex-wrap items-center gap-2"
      >
        <FilterPill
          active={filter === "all"}
          onClick={() => setFilter("all")}
          count={list.length}
          label="All"
        />
        {present.map((category) => (
          <FilterPill
            key={category.value}
            active={filter === category.value}
            onClick={() => setFilter(category.value as FilterKey)}
            count={list.filter((p) => p.category === category.value).length}
            label={category.label}
          />
        ))}
      </div>

      {/* ---- grid ---- */}
      {visible.length === 0 ? (
        <PlaceholderNote className="mt-8">
          No projects in this category yet — add one from the admin dashboard
          and it will appear here.
        </PlaceholderNote>
      ) : (
        <Stagger
          key={filter}
          step={0.07}
          className="mt-[clamp(1.75rem,4vw,3rem)] grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {visible.map((project, i) => (
            <WorkCard key={project.id} project={project} index={i} />
          ))}
        </Stagger>
      )}

      {/* View all — the archive below holds every published build that is not
          in the featured grid. */}
      <div className="mt-[clamp(1.75rem,3.5vw,2.75rem)] flex justify-end">
        <a
          href="#archive"
          data-cursor="view"
          className="group inline-flex items-center gap-2 text-[0.9rem] font-medium text-fg transition-colors duration-300 hover:text-accent"
        >
          View all builds
          <span
            aria-hidden="true"
            className="transition-transform duration-300 group-hover:translate-x-1"
          >
            →
          </span>
        </a>
      </div>
    </Section>
  );
}

function FilterPill({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-pill border px-4 text-[0.8125rem] uppercase tracking-[0.06em] transition-colors duration-300",
        "data-[pressed=true]:border-accent data-[pressed=true]:bg-accent/10 data-[pressed=true]:text-fg",
        "border-line text-fg-muted hover:border-line-strong hover:text-fg",
      )}
      data-pressed={active || undefined}
    >
      {label}
      <span
        className={cn(
          "type-mono text-[0.6875rem] tabular-nums",
          active ? "text-accent" : "text-fg-subtle",
        )}
      >
        {String(count).padStart(2, "0")}
      </span>
    </button>
  );
}

function WorkCard({ project, index }: { project: Project; index: number }) {
  const categoryLabel =
    PROJECT_CATEGORIES.find((c) => c.value === project.category)?.label ??
    project.category;
  const status = project.liveUrl
    ? { label: "Live", tone: "text-pulse-300" }
    : project.repoUrl
      ? { label: "Source", tone: "text-fg-muted" }
      : null;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-card border border-line bg-surface transition-[border-color,box-shadow] duration-500 ease-out hover:border-accent/50 hover:shadow-[0_18px_44px_-22px_rgba(61,108,242,0.35)]">
      {/* Visual: demo recording when present, still otherwise */}
      <ProjectLoopVideo
        src={project.videoUrl}
        poster={project.videoPosterUrl}
        stillSrc={project.imageUrl}
        title={project.title}
        slug={project.slug}
        className="aspect-[16/10] w-full"
      />

      <div className="flex flex-1 flex-col p-[clamp(1.25rem,2.6vw,1.75rem)]">
        {/* index + category */}
        <div className="flex items-center gap-3">
          <span className="type-mono text-accent tabular-nums">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span aria-hidden="true" className="h-px flex-1 bg-line group-hover:bg-accent/40" />
          <span className="type-mono text-fg-subtle">{categoryLabel}</span>
          {project.year ? (
            <span className="type-mono text-fg-subtle">{project.year}</span>
          ) : null}
        </div>

        <h3 className="type-display mt-4 text-h3 leading-[0.94] tracking-tight text-fg">
          {project.title}
        </h3>

        {project.tagline ? (
          <p className="type-mono mt-2.5 text-fg-muted">{project.tagline}</p>
        ) : null}

        {project.summary ? (
          <p className="mt-4 max-w-[52ch] text-body leading-relaxed text-fg-muted">
            {project.summary}
          </p>
        ) : null}

        {project.tech.length > 0 ? (
          <ul className="mt-5 flex flex-wrap gap-2">
            {project.tech.slice(0, 5).map((tech) => (
              <li key={tech}>
                <Tag>{tech}</Tag>
              </li>
            ))}
          </ul>
        ) : null}

        {/* status + action */}
        <div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-4">
          {status ? (
            <span className={cn("type-mono inline-flex items-center gap-2", status.tone)}>
              <span
                aria-hidden="true"
                className={cn(
                  "size-1.5 rounded-full",
                  status.label === "Live" ? "bg-pulse-400" : "bg-line-strong",
                )}
              />
              {status.label}
            </span>
          ) : (
            <span className="type-mono text-fg-subtle">Case study</span>
          )}

          <a
            href={`/work/${project.slug}`}
            data-cursor="view"
            className="inline-flex items-center gap-1.5 text-[0.875rem] font-medium text-fg transition-colors duration-300 hover:text-accent"
          >
            View project
            <ArrowUpRight
              className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              strokeWidth={2}
            />
          </a>
        </div>
      </div>
    </article>
  );
}