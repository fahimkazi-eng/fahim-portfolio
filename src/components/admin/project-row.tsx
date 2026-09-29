"use client";

import Link from "next/link";
import { ExternalLink, Pencil } from "lucide-react";
import type { Project } from "@/lib/db/schema";
import { deleteProjectAction, toggleProjectFlagAction } from "@/app/actions/admin";
import { Card } from "@/components/ui/card";
import { InlineAction } from "@/components/admin/form-primitives";

export function ProjectRow({ project }: { project: Project }) {
  return (
    <Card className="flex flex-wrap items-center gap-4 p-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href={`/admin/projects/${project.id}`}
            className="font-display text-[1.05rem] font-semibold tracking-tight text-fg transition-colors duration-200 hover:text-accent"
          >
            {project.title}
          </Link>
          <span className="type-mono text-fg-subtle">/{project.slug}</span>
          {!project.published ? (
            <span className="type-mono rounded-pill border border-line-strong px-2 py-0.5 text-fg-subtle">
              Draft
            </span>
          ) : null}
          {project.featured ? (
            <span className="type-mono rounded-pill border border-accent/40 px-2 py-0.5 text-accent">
              Featured
            </span>
          ) : null}
        </div>

        <p className="mt-1 line-clamp-1 text-[0.8125rem] text-fg-muted">
          {project.tagline || project.summary || "No summary yet."}
        </p>

        <p className="type-mono mt-1.5 text-fg-subtle">
          {[
            project.year,
            `${project.features.length} features`,
            `${project.tech.length} technologies`,
          ]
            .filter(Boolean)
            .join("  ·  ")}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <InlineAction
          action={toggleProjectFlagAction}
          hidden={{ id: project.id, field: "published" }}
          title={project.published ? "Unpublish" : "Publish"}
        >
          {project.published ? "Unpublish" : "Publish"}
        </InlineAction>

        <InlineAction
          action={toggleProjectFlagAction}
          hidden={{ id: project.id, field: "featured" }}
          title={project.featured ? "Remove from featured" : "Feature this project"}
        >
          {project.featured ? "Unfeature" : "Feature"}
        </InlineAction>

        <Link
          href={`/admin/projects/${project.id}`}
          className="inline-flex items-center gap-1.5 rounded-md border border-line-strong px-2.5 py-1.5 text-[0.75rem] text-fg-muted transition-colors duration-200 hover:border-accent hover:text-accent"
        >
          <Pencil className="size-3" strokeWidth={2} />
          Edit
        </Link>

        <Link
          href={`/work/${project.slug}`}
          target="_blank"
          className="inline-flex items-center gap-1.5 rounded-md border border-line-strong px-2.5 py-1.5 text-[0.75rem] text-fg-muted transition-colors duration-200 hover:border-accent hover:text-accent"
        >
          <ExternalLink className="size-3" strokeWidth={2} />
          View
        </Link>

        <InlineAction
          action={deleteProjectAction}
          hidden={{ id: project.id }}
          confirm={`Delete "${project.title}" permanently? This cannot be undone.`}
          title="Delete project"
        >
          Delete
        </InlineAction>
      </div>
    </Card>
  );
}
