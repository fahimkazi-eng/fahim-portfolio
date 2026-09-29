"use client";

import type { Education, Experience, Service, Skill } from "@/lib/db/schema";
import {
  deleteEducationAction,
  deleteExperienceAction,
  deleteServiceAction,
  deleteSkillAction,
  saveEducationAction,
  saveExperienceAction,
  saveServiceAction,
  saveSkillAction,
} from "@/app/actions/admin";
import { Card } from "@/components/ui/card";
import { InlineAction } from "@/components/admin/form-primitives";
import {
  ACheckbox,
  AField,
  ALineList,
  ATextarea,
  AdminForm,
  CheckboxRow,
} from "@/components/admin/form-primitives";

/* ==========================================================================
   Editors for the four simpler content types. Each renders an existing
   record inline for editing, plus a create form at the bottom of the page.
   ========================================================================== */

/* --------------------------------- Experience --------------------------- */

export function ExperienceEditor({ item }: { item?: Experience }) {
  return (
    <AdminForm
      action={saveExperienceAction}
      hidden={{ id: item?.id }}
      submitLabel={item ? "Save role" : "Add role"}
    >
      {(state) => {
        const errors = state.status === "error" ? state.fieldErrors : undefined;
        return (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
              <AField
                label="Role"
                name="role"
                required
                errors={errors}
                defaultValue={item?.role}
              />
              <AField
                label="Organization"
                name="organization"
                required
                errors={errors}
                defaultValue={item?.organization}
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              <AField
                label="Location"
                name="location"
                errors={errors}
                defaultValue={item?.location ?? ""}
              />
              <AField
                label="Start"
                name="startDate"
                required
                errors={errors}
                defaultValue={item?.startDate}
                placeholder="2023"
              />
              <AField
                label="End"
                name="endDate"
                errors={errors}
                defaultValue={item?.current ? "" : (item?.endDate ?? "")}
                placeholder="2024"
                hint={item?.current ? "Ignored while current" : undefined}
              />
            </div>
            <ATextarea
              label="Description"
              name="description"
              errors={errors}
              defaultValue={item?.description}
              rows={4}
            />
            <ALineList
              label="Highlights"
              name="highlights"
              errors={errors}
              values={item?.highlights ?? []}
              rows={5}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <ACheckbox label="Currently in this role" name="current" defaultChecked={item?.current} />
              <AField
                label="Sort order"
                name="sortOrder"
                type="number"
                errors={errors}
                defaultValue={item?.sortOrder ?? 0}
              />
            </div>
            {item ? <DeleteButton id={item.id} label={item.role} action={deleteExperienceAction} /> : null}
          </>
        );
      }}
    </AdminForm>
  );
}

export function ExperienceCard({ item }: { item: Experience }) {
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-[1.05rem] font-semibold tracking-tight text-fg">
            {item.role}
          </p>
          <p className="type-mono mt-1 text-fg-muted">
            {item.organization}
            {item.location ? ` · ${item.location}` : ""}
          </p>
          <p className="type-mono mt-1 text-fg-subtle">
            {item.startDate} — {item.current ? "Present" : item.endDate}
          </p>
        </div>
        <span className="type-mono rounded-pill border border-line-strong px-2 py-0.5 text-fg-subtle">
          #{item.sortOrder}
        </span>
      </div>

      {item.description ? (
        <p className="mt-3 text-[0.875rem] leading-relaxed text-fg-muted">
          {item.description}
        </p>
      ) : null}

      <details className="mt-4 border-t border-line pt-3">
        <summary className="type-mono cursor-pointer text-fg-subtle transition-colors duration-200 hover:text-accent">
          Edit this role
        </summary>
        <div className="mt-4">
          <ExperienceEditor item={item} />
        </div>
      </details>
    </Card>
  );
}

/* --------------------------------- Education ---------------------------- */

export function EducationEditor({ item }: { item?: Education }) {
  return (
    <AdminForm
      action={saveEducationAction}
      hidden={{ id: item?.id }}
      submitLabel={item ? "Save entry" : "Add entry"}
    >
      {(state) => {
        const errors = state.status === "error" ? state.fieldErrors : undefined;
        return (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
              <AField
                label="Degree"
                name="degree"
                required
                errors={errors}
                defaultValue={item?.degree}
              />
              <AField
                label="Institution"
                name="institution"
                required
                errors={errors}
                defaultValue={item?.institution}
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              <AField
                label="Location"
                name="location"
                errors={errors}
                defaultValue={item?.location ?? ""}
              />
              <AField
                label="Start year"
                name="startYear"
                required
                errors={errors}
                defaultValue={item?.startYear}
              />
              <AField
                label="End year"
                name="endYear"
                required
                errors={errors}
                defaultValue={item?.endYear}
              />
            </div>
            <ATextarea
              label="Description"
              name="description"
              errors={errors}
              defaultValue={item?.description}
              rows={3}
            />
            <CheckboxRow>
              <ACheckbox label="Currently studying" name="current" defaultChecked={item?.current} />
              <AField
                label="Sort order"
                name="sortOrder"
                type="number"
                errors={errors}
                defaultValue={item?.sortOrder ?? 0}
                className="w-32"
              />
            </CheckboxRow>
            {item ? <DeleteButton id={item.id} label={item.degree} action={deleteEducationAction} /> : null}
          </>
        );
      }}
    </AdminForm>
  );
}

export function EducationCard({ item }: { item: Education }) {
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-[1.05rem] font-semibold tracking-tight text-fg">
            {item.degree}
          </p>
          <p className="type-mono mt-1 text-fg-muted">{item.institution}</p>
          <p className="type-mono mt-1 text-fg-subtle">
            {item.startYear} — {item.current ? "Present" : item.endYear}
          </p>
        </div>
      </div>

      <details className="mt-4 border-t border-line pt-3">
        <summary className="type-mono cursor-pointer text-fg-subtle transition-colors duration-200 hover:text-accent">
          Edit this entry
        </summary>
        <div className="mt-4">
          <EducationEditor item={item} />
        </div>
      </details>
    </Card>
  );
}

/* ---------------------------------- Skills ----------------------------- */

export function SkillEditor({ item }: { item?: Skill }) {
  return (
    <AdminForm
      action={saveSkillAction}
      hidden={{ id: item?.id }}
      submitLabel={item ? "Save skill" : "Add skill"}
    >
      {(state) => {
        const errors = state.status === "error" ? state.fieldErrors : undefined;
        return (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
              <AField
                label="Name"
                name="name"
                required
                errors={errors}
                defaultValue={item?.name}
              />
              <AField
                label="Category"
                name="category"
                required
                errors={errors}
                defaultValue={item?.category}
                placeholder="Professional"
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              <AField
                label="Level (0–100)"
                name="level"
                type="number"
                errors={errors}
                defaultValue={item?.level ?? ""}
                hint="Optional"
              />
              <AField
                label="Note"
                name="note"
                errors={errors}
                defaultValue={item?.note ?? ""}
                hint="Optional"
              />
              <AField
                label="Sort order"
                name="sortOrder"
                type="number"
                errors={errors}
                defaultValue={item?.sortOrder ?? 0}
              />
            </div>
            {item ? <DeleteButton id={item.id} label={item.name} action={deleteSkillAction} /> : null}
          </>
        );
      }}
    </AdminForm>
  );
}

export function SkillCard({ item }: { item: Skill }) {
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-body text-fg">{item.name}</p>
          <p className="type-mono mt-0.5 text-fg-subtle">
            {item.category}
            {item.level !== null ? ` · ${item.level}/100` : ""}
          </p>
        </div>
        <InlineAction
          action={deleteSkillAction}
          hidden={{ id: item.id }}
          confirm={`Remove "${item.name}"?`}
        >
          Remove
        </InlineAction>
      </div>
      <details className="mt-3 border-t border-line pt-3">
        <summary className="type-mono cursor-pointer text-fg-subtle transition-colors duration-200 hover:text-accent">
          Edit
        </summary>
        <div className="mt-3">
          <SkillEditor item={item} />
        </div>
      </details>
    </Card>
  );
}

/* --------------------------------- Services ---------------------------- */

export function ServiceEditor({ item }: { item?: Service }) {
  return (
    <AdminForm
      action={saveServiceAction}
      hidden={{ id: item?.id }}
      submitLabel={item ? "Save service" : "Add service"}
    >
      {(state) => {
        const errors = state.status === "error" ? state.fieldErrors : undefined;
        return (
          <>
            <AField
              label="Title"
              name="title"
              required
              errors={errors}
              defaultValue={item?.title}
            />
            <ATextarea
              label="Description"
              name="description"
              required
              errors={errors}
              defaultValue={item?.description}
              rows={4}
            />
            <ALineList
              label="Deliverables"
              name="deliverables"
              errors={errors}
              values={item?.deliverables ?? []}
              rows={5}
            />
            <AField
              label="Sort order"
              name="sortOrder"
              type="number"
              errors={errors}
              defaultValue={item?.sortOrder ?? 0}
              className="max-w-40"
            />
            {item ? <DeleteButton id={item.id} label={item.title} action={deleteServiceAction} /> : null}
          </>
        );
      }}
    </AdminForm>
  );
}

export function ServiceCard({ item }: { item: Service }) {
  return (
    <Card className="p-5">
      <p className="font-display text-[1.05rem] font-semibold tracking-tight text-fg">
        {item.title}
      </p>
      <p className="mt-2 text-[0.875rem] leading-relaxed text-fg-muted">
        {item.description}
      </p>
      {item.deliverables.length > 0 ? (
        <ul className="type-mono mt-3 flex flex-wrap gap-2 text-fg-subtle">
          {item.deliverables.map((d) => (
            <li key={d} className="rounded-pill border border-line px-2 py-0.5">
              {d}
            </li>
          ))}
        </ul>
      ) : null}
      <details className="mt-4 border-t border-line pt-3">
        <summary className="type-mono cursor-pointer text-fg-subtle transition-colors duration-200 hover:text-accent">
          Edit
        </summary>
        <div className="mt-4">
          <ServiceEditor item={item} />
        </div>
      </details>
    </Card>
  );
}

/* --------------------------------- Shared ------------------------------ */

function DeleteButton({
  id,
  label,
  action,
}: {
  id: number;
  label: string;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <div className="border-t border-line pt-4">
      <InlineAction
        action={action}
        hidden={{ id }}
        confirm={`Delete "${label}"? This cannot be undone.`}
      >
        Delete
      </InlineAction>
    </div>
  );
}
