import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProjectEditor } from "@/components/admin/project-editor";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function NewProjectPage() {
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
        <h1 className="type-display mt-3 text-h2 text-fg">New project</h1>
        <p className="mt-2 max-w-[52ch] text-body text-fg-muted">
          Anything you leave blank renders as a visible &ldquo;awaiting
          content&rdquo; marker on the public page. Nothing is generated for you.
        </p>
      </header>

      <Card className="p-6">
        <ProjectEditor />
      </Card>
    </div>
  );
}
