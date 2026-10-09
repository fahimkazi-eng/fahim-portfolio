"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/* ==========================================================================
   Field primitives.
   Every input is uncontrolled-friendly, forwards refs, wires its own
   aria-invalid / aria-describedby, and shows errors from a Server Action
   without any client state.
   ========================================================================== */

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string | string[];
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const message = Array.isArray(error) ? error[0] : error;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor={htmlFor}
          className="type-mono text-fg-muted [font-size:var(--text-tiny)]"
        >
          {label}
          {required ? (
            <span className="ml-1 text-accent" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
        {hint ? (
          <span className="text-[0.7rem] text-fg-subtle">{hint}</span>
        ) : null}
      </div>
      {children}
      <p
        id={`${htmlFor}-error`}
        role={message ? "alert" : undefined}
        aria-live="polite"
        className={cn(
          "text-[0.75rem] leading-snug transition-opacity duration-200",
          message ? "text-accent opacity-100" : "opacity-0",
        )}
      >
        {message ?? "\u00A0"}
      </p>
    </div>
  );
}

const controlBase = [
  "w-full rounded-lg border bg-canvas/60 px-3.5 text-body text-fg",
  "placeholder:text-fg-subtle",
  "transition-[border-color,box-shadow,background-color] duration-200",
  "hover:border-line-strong",
  "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 focus:bg-canvas",
  "disabled:opacity-50",
  "aria-[invalid=true]:border-accent aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-accent/20",
].join(" ");

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }
>(({ className, invalid, ...props }, ref) => (
  <input
    ref={ref}
    aria-invalid={invalid || undefined}
    className={cn(controlBase, "h-11", className)}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(({ className, invalid, ...props }, ref) => (
  <textarea
    ref={ref}
    aria-invalid={invalid || undefined}
    className={cn(controlBase, "min-h-32 resize-y py-3", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }
>(({ className, invalid, children, ...props }, ref) => (
  <select
    ref={ref}
    aria-invalid={invalid || undefined}
    className={cn(controlBase, "h-11 appearance-none pr-9", className)}
    style={{
      backgroundImage:
        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none' stroke='%238b8b95' stroke-width='1.6'%3E%3Cpath d='M1 1.5 6 6.5 11 1.5'/%3E%3C/svg%3E\")",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "right 0.85rem center",
    }}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";

/* Checkbox — square, on-brand, keyboard focus ring preserved. */
export const Checkbox = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, id, ...props }, ref) => (
  <span className="inline-flex items-center gap-2.5">
    <input
      ref={ref}
      id={id}
      type="checkbox"
      className={cn(
        "peer size-4 shrink-0 cursor-pointer appearance-none rounded-[3px] border border-line-strong",
        "bg-canvas transition-colors duration-150",
        "checked:border-accent checked:bg-accent",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
    <label
      htmlFor={id}
      className="cursor-pointer text-[0.8125rem] text-fg-muted select-none"
    >
      {props["aria-label"]}
    </label>
  </span>
));
Checkbox.displayName = "Checkbox";

/* Form-level status banner. */
export function FormStatus({
  status,
  message,
}: {
  status: "idle" | "success" | "error";
  message?: string;
}) {
  if (status === "idle" || !message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-start gap-3 rounded-lg border px-4 py-3.5 text-[0.875rem] leading-relaxed",
        status === "success"
          ? "border-accent/40 bg-accent/[0.07] text-fg"
          : "border-accent/60 bg-accent/[0.11] text-fg",
      )}
    >
      <span
        aria-hidden="true"
        className="type-mono mt-px shrink-0 text-accent"
      >
        {status === "success" ? "OK" : "ERR"}
      </span>
      <span>{message}</span>
    </div>
  );
}

/* Submit button that shows a pending state without losing its width. */
export function SubmitButton({
  pending,
  children,
  pendingLabel = "Sending",
  className,
  variant = "accent",
  size = "lg",
  type = "submit",
}: {
  pending: boolean;
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  variant?: "accent" | "primary" | "outline";
  size?: "sm" | "md" | "lg";
  type?: "submit" | "button" | "reset";
}) {
  const base =
    "relative inline-flex items-center justify-center gap-2.5 rounded-pill font-medium transition-[background-color,color,border-color,filter] duration-300 disabled:pointer-events-none disabled:opacity-60";
  const sizes = { sm: "h-9 px-4 text-[0.8125rem]", md: "h-11 px-6 text-[0.9rem]", lg: "h-[3.25rem] px-8 text-[0.95rem]" };
  const variants = {
    accent: "bg-accent text-accent-fg hover:brightness-110 shadow-glow",
    primary: "bg-fg text-canvas hover:bg-accent hover:text-accent-fg",
    outline: "border border-line-strong text-fg hover:border-accent hover:text-accent",
  };

  return (
    <button
      type={type}
      disabled={pending}
      className={cn(base, sizes[size], variants[variant], className)}
    >
      <span
        className={cn(
          "transition-opacity duration-200",
          pending ? "opacity-0" : "opacity-100",
        )}
      >
        {children}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-0 flex items-center justify-center gap-2.5 transition-opacity duration-200",
          pending ? "opacity-100" : "opacity-0",
        )}
      >
        <Spinner />
        {pendingLabel}
      </span>
    </button>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "size-3.5 rounded-full border-2 border-current border-r-transparent",
        "animate-spin motion-off:animate-none",
        className,
      )}
    />
  );
}
