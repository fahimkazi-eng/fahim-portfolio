"use client";

import Link from "next/link";
import type { Project } from "@/lib/db/schema";
import { saveProjectAction } from "@/app/actions/admin";
import {
  ACheckbox,
  AField,
  ALineList,
  ASelect,
  ATextarea,
  AdminForm,
  CheckboxRow,
} from "@/components/admin/form-primitives";
import { PROJECT_CATEGORIES } from "@/lib/project-categories";

/**
 * The one and only project form. Used for create (no `project`) and for edit
 * (`project` supplied) so the field set can never drift between the two.
 */
export function ProjectEditor({ project }: { project?: Project }) {
  return (
    <AdminForm
      action={saveProjectAction}
      hidden={{ id: project?.id }}
      submitLabel={project ? "Save project" : "Create project"}
      pendingLabel="Saving project"
    >
      {(state) => {
        const errors = state.status === "error" ? state.fieldErrors : undefined;

        return (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
              <AField
                label="Title"
                name="title"
                required
                errors={errors}
                defaultValue={project?.title}
                placeholder="Unimate"
              />
              <AField
                label="Slug"
                name="slug"
                required
                errors={errors}
                defaultValue={project?.slug}
                placeholder="unimate"
                hint="lowercase-with-hyphens"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <AField
                label="Tagline"
                name="tagline"
                errors={errors}
                defaultValue={project?.tagline ?? ""}
                placeholder="University platform"
              />
              <AField
                label="Year"
                name="year"
                errors={errors}
                defaultValue={project?.year ?? ""}
                placeholder="2025"
              />
            </div>

            <ATextarea
              label="One-line summary"
              name="summary"
              errors={errors}
              defaultValue={project?.summary}
              rows={3}
              placeholder="What it is, in one or two sentences."
            />

            {/* --- case study structure --- */}
            <fieldset className="space-y-5 rounded-card border border-line p-5">
              <legend className="type-mono px-2 text-fg-subtle">
                Case study
              </legend>

              <ATextarea
                label="01 · Problem"
                name="problem"
                errors={errors}
                defaultValue={project?.problem}
                rows={4}
                placeholder="What problem existed, and for whom?"
              />
              <ATextarea
                label="02 · Solution"
                name="solution"
                errors={errors}
                defaultValue={project?.solution}
                rows={4}
                placeholder="The approach you took."
              />
              <ALineList
                label="03 · Features"
                name="features"
                errors={errors}
                values={project?.features ?? []}
                rows={6}
                placeholder={"Search and filtering\nBooking flow\nAdmin dashboard"}
              />
              <ATextarea
                label="04 · Implementation"
                name="implementation"
                errors={errors}
                defaultValue={project?.implementation}
                rows={4}
                placeholder="How it was built — architecture, data model, decisions."
              />
              <ATextarea
                label="05 · Result"
                name="result"
                errors={errors}
                defaultValue={project?.result}
                rows={4}
                placeholder="What came out of it. Only real, verifiable outcomes."
              />
            </fieldset>

            <div className="grid gap-5 sm:grid-cols-2">
              <ALineList
                label="Technologies"
                name="tech"
                errors={errors}
                values={project?.tech ?? []}
                rows={6}
                placeholder={"Next.js\nPostgreSQL\nDrizzle ORM"}
              />
              <ALineList
                label="Gallery images"
                name="gallery"
                errors={errors}
                values={project?.gallery ?? []}
                rows={6}
                hint="Paths under /public, one per line"
                placeholder={"unimate-home.webp\nunimate-search.webp"}
              />
            </div>

            {/* --- media + links --- */}
            <div className="grid gap-5 sm:grid-cols-3">
              <AField
                label="Cover image"
                name="imageUrl"
                errors={errors}
                defaultValue={project?.imageUrl ?? ""}
                placeholder="/projects/cover.jpg"
                hint="Path or full URL"
              />
              <AField
                label="Live URL"
                name="liveUrl"
                type="url"
                errors={errors}
                defaultValue={project?.liveUrl ?? ""}
                placeholder="https://…"
              />
              <AField
                label="Repository URL"
                name="repoUrl"
                type="url"
                errors={errors}
                defaultValue={project?.repoUrl ?? ""}
                placeholder="https://github.com/…"
              />
            </div>

            <fieldset className="space-y-4 rounded-card border border-line p-5">
              <legend className="type-mono px-2 text-fg-subtle">
                Demo video
              </legend>
              <p className="max-w-[62ch] text-[0.8125rem] leading-relaxed text-fg-muted">
                A real screen recording, stored under{" "}
                <code className="type-mono text-fg-subtle">public/projects/</code>
                . When a video path is set it becomes the case study&apos;s
                primary visual — a short demo of the product running says more
                than any screenshot, and it can&apos;t be faked. Leave both
                fields empty and the page falls back to the still image, then to
                the generative signature.
              </p>
              <div className="grid gap-5 sm:grid-cols-2">
                <AField
                  label="Video path"
                  name="videoUrl"
                  errors={errors}
                  defaultValue={project?.videoUrl ?? ""}
                  placeholder="/projects/unimate-demo.mp4"
                  hint="Path or full URL · .mp4 / .webm"
                />
                <AField
                  label="Poster image"
                  name="videoPosterUrl"
                  errors={errors}
                  defaultValue={project?.videoPosterUrl ?? ""}
                  placeholder="/projects/unimate-demo-poster.jpg"
                  hint="Shown before playback"
                />
              </div>
            </fieldset>

            <div className="grid gap-5 sm:grid-cols-2">
              <AField
                label="Your role"
                name="role"
                errors={errors}
                defaultValue={project?.role ?? ""}
                placeholder="Full-stack developer"
              />
              <ASelect
                label="Category"
                name="category"
                errors={errors}
                defaultValue={project?.category ?? "web-app"}
                hint="Drives the featured-grid filter pills"
                options={PROJECT_CATEGORIES}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <AField
                label="Sort order"
                name="sortOrder"
                type="number"
                errors={errors}
                defaultValue={project?.sortOrder ?? 0}
                hint="Lower appears first"
              />
            </div>

            <CheckboxRow>
              <ACheckbox
                label="Published"
                name="published"
                defaultChecked={project?.published ?? true}
              />
              <ACheckbox
                label="Featured on the homepage"
                name="featured"
                defaultChecked={project?.featured ?? false}
              />
            </CheckboxRow>

            {project ? (
              <p className="type-mono text-fg-subtle">
                <Link
                  href={`/admin/projects/${project.id}`}
                  className="text-fg-muted underline underline-offset-4 transition-colors hover:text-accent"
                >
                  Open the full-page editor
                </Link>
              </p>
            ) : null}
          </>
        );
      }}
    </AdminForm>
  );
}
