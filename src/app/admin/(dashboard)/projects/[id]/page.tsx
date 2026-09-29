import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllProjects, getProjectById } from "@/lib/db/queries";
import { ProjectEditor } from "@/components/admin/project-editor";
import { deleteProjectAction } from "@/app/actions/admin";
import { InlineAction } from "@/components/admin/form-primitives";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const project = await getProjectById(Number(id));
  return { title: project ? `Edit ${project.title}` : "Project not found" };
}

export default async function EditProjectPage({ params }: Props) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) notFound();

  const project = await getProjectById(numericId);
  if (!project) notFound();

  const all = await getAllProjects();
  const position = all.findIndex((p) => p.id === project.id);

  return (
    <div className="space-y-7">
      <header>
        <Link
          href="/admin/projects"
          className="type-mono inline-flex items-center gap-1.5 text-fg-muted transition-colors duration-200 hover:text-accent"
        >
          <ArrowLeft className="size-3" strokeWidth={2} />
          All projects
        </Link>
        <h1 className="type-display mt-3 text-h2 text-fg">{project.title}</h1>
        <p className="type-mono mt-2 text-fg-subtle">
          /{project.slug} · position {position + 1} of {all.length}
        </p>
      </header>

      <Card className="p-6">
        <ProjectEditor project={project} />
      </Card>

      <Card className="flex flex-wrap items-center justify-between gap-4 border-accent/40 p-5">
        <div>
          <p className="type-mono text-accent">Danger zone</p>
          <p className="mt-1 text-[0.8125rem] text-fg-muted">
            Deleting removes the case study permanently. There is no undo.
          </p>
        </div>
        <InlineAction
          action={deleteProjectAction}
          hidden={{ id: project.id }}
          confirm={`Delete "${project.title}" permanently?`}
          title="Delete project"
        >
          Delete this project
        </InlineAction>
      </Card>
    </div>
  );
}
