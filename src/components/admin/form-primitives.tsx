"use client";

import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import {
  Checkbox,
  Field,
  FormStatus,
  Input,
  SubmitButton,
  Textarea,
} from "@/components/ui/field";
import { idleState, type ActionState } from "@/lib/validations/schemas";

/* ==========================================================================
   Reusable admin form primitives.

   Every form gets the same three things for free:
     - useActionState wiring
     - a pending state on the submit button
     - field-level errors rendered next to the field that caused them
   ========================================================================== */

export function AdminForm({
  action,
  children,
  className = "",
  submitLabel = "Save changes",
  pendingLabel = "Saving",
  hidden,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  /** Receives the current state so each field can read its own errors. */
  children: (state: ActionState) => ReactNode;
  className?: string;
  submitLabel?: string;
  pendingLabel?: string;
  hidden?: Record<string, string | number | undefined>;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    action,
    idleState,
  );

  return (
    <form action={formAction} noValidate className={`space-y-5 ${className}`}>
      <FormStatus status={state.status} message={state.message} />

      {Object.entries(hidden ?? {}).map(([name, value]) =>
        value === undefined ? null : (
          <input key={name} type="hidden" name={name} value={String(value)} />
        ),
      )}

      {children(state)}

      <FormFooter submitLabel={submitLabel} pendingLabel={pendingLabel} />
    </form>
  );
}

function FormFooter({
  submitLabel,
  pendingLabel,
}: {
  submitLabel: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();
  return (
    <div className="flex flex-wrap justify-end gap-3 border-t border-line pt-5">
      <SubmitButton
        pending={pending}
        pendingLabel={pendingLabel}
        variant="primary"
        size="md"
      >
        {submitLabel}
      </SubmitButton>
    </div>
  );
}

/* --------------------------------------------------------------------------
   Field primitives
   -------------------------------------------------------------------------- */

export function AField({
  label,
  name,
  errors,
  required,
  hint,
  type = "text",
  defaultValue,
  placeholder,
  autoComplete,
  className,
  inputClassName,
}: {
  label: string;
  name: string;
  errors?: Record<string, string[]>;
  required?: boolean;
  hint?: string;
  type?: string;
  defaultValue?: string | number;
  placeholder?: string;
  autoComplete?: string;
  className?: string;
  inputClassName?: string;
}) {
  const id = `f-${name}`;
  return (
    <Field
      label={label}
      htmlFor={id}
      required={required}
      hint={hint}
      error={errors?.[name]}
      className={className}
    >
      <Input
        id={id}
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        invalid={Boolean(errors?.[name])}
        aria-describedby={`${id}-error`}
        className={inputClassName}
      />
    </Field>
  );
}

export function ATextarea({
  label,
  name,
  errors,
  required,
  defaultValue,
  placeholder,
  rows = 4,
  className,
  hint,
}: {
  label: string;
  name: string;
  errors?: Record<string, string[]>;
  required?: boolean;
  defaultValue?: string | null;
  placeholder?: string;
  rows?: number;
  className?: string;
  hint?: string;
}) {
  const id = `f-${name}`;
  return (
    <Field
      label={label}
      htmlFor={id}
      required={required}
      hint={hint}
      error={errors?.[name]}
      className={className}
    >
      <Textarea
        id={id}
        name={name}
        rows={rows}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        required={required}
        invalid={Boolean(errors?.[name])}
        aria-describedby={`${id}-error`}
      />
    </Field>
  );
}

/**
 * text[] column editor. A plain textarea, one item per line — the Zod schema
 * splits it server-side. Uncontrolled, so typing never re-renders React.
 */
export function ALineList({
  label,
  name,
  values,
  errors,
  hint = "One item per line",
  placeholder,
  rows = 5,
  mono = true,
}: {
  label: string;
  name: string;
  values: string[];
  errors?: Record<string, string[]>;
  hint?: string;
  placeholder?: string;
  rows?: number;
  mono?: boolean;
}) {
  const id = `f-${name}`;
  return (
    <Field
      label={label}
      htmlFor={id}
      hint={hint}
      error={errors?.[name]}
    >
      <textarea
        id={id}
        name={name}
        rows={rows}
        defaultValue={values.join("\n")}
        placeholder={placeholder}
        aria-describedby={`${id}-error`}
        className={[
          "w-full resize-y rounded-lg border border-line bg-canvas/60 px-3.5 py-3 text-[0.875rem] leading-relaxed text-fg",
          "placeholder:text-fg-subtle transition-colors duration-200",
          "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25",
          "aria-[invalid=true]:border-accent",
          mono ? "font-mono text-[0.8125rem]" : "",
        ].join(" ")}
      />
    </Field>
  );
}

export function ACheckbox({
  label,
  name,
  defaultChecked,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
}) {
  return (
    <Checkbox
      id={`f-${name}`}
      name={name}
      defaultChecked={defaultChecked}
      aria-label={label}
    />
  );
}

export function CheckboxRow({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`flex flex-wrap gap-6 ${className}`}>{children}</div>;
}

/* --------------------------------------------------------------------------
   Immediate-action form (delete / toggle). Submits on click, no state.
   -------------------------------------------------------------------------- */

export function InlineAction({
  action,
  hidden,
  children,
  className = "",
  confirm,
  title,
  ariaLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  hidden: Record<string, string | number>;
  children: ReactNode;
  className?: string;
  confirm?: string;
  title?: string;
  ariaLabel?: string;
}) {
  return (
    <form
      action={action}
      className={className}
      onSubmit={(event) => {
        if (confirm && !window.confirm(confirm)) event.preventDefault();
      }}
    >
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={String(value)} />
      ))}
      <button
        type="submit"
        title={title}
        aria-label={ariaLabel}
        className="inline-flex items-center gap-1.5 rounded-md border border-line-strong px-2.5 py-1.5 text-[0.75rem] text-fg-muted transition-colors duration-200 hover:border-accent hover:text-accent"
      >
        {children}
      </button>
    </form>
  );
}
