import Link from "next/link";
import { Plus } from "lucide-react";
import { getAllProjects } from "@/lib/db/queries";
import { Card } from "@/components/ui/card";
import { ProjectRow } from "@/components/admin/project-row";
import { ProjectEditor } from "@/components/admin/project-editor";

export const dynamic = "force-dynamic";

export default async function AdminProjectsPage() {
  const projects = await getAllProjects();

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="type-mono text-accent">Projects</p>
          <h1 className="type-display mt-2 text-h2 text-fg">Case studies</h1>
          <p className="mt-2 max-w-[52ch] text-body text-fg-muted">
            Each project drives both the featured-work panel and the narrative
            case study. Leave a section empty and the public page shows a
            visible &ldquo;awaiting content&rdquo; marker instead of filler.
          </p>
        </div>
        <Link
          href="/admin/projects/new"
          className="inline-flex h-11 items-center gap-2 rounded-pill bg-accent px-5 text-[0.9rem] font-medium text-accent-fg transition-[filter] duration-300 hover:brightness-110"
        >
          <Plus className="size-4" strokeWidth={2} />
          New project
        </Link>
      </header>

      {projects.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-body text-fg-muted">
            No projects yet. Create your first case study.
          </p>
        </Card>
      ) : (
        <ul className="space-y-2">
          {projects.map((project) => (
            <li key={project.id}>
              <ProjectRow project={project} />
            </li>
          ))}
        </ul>
      )}

      {/* Inline editor for the common case; the full form lives on its own page. */}
      <section>
        <h2 className="mb-4 font-display text-h4 tracking-tight text-fg">
          Add a project
        </h2>
        <Card className="p-6">
          <ProjectEditor />
        </Card>
      </section>
    </div>
  );
}
