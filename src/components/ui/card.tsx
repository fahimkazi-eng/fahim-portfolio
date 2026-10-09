import * as React from "react";
import { cn } from "@/lib/utils";

/* Card — the bento primitive.
   `sweep` adds the animated conic border. `glass` adds the blurred veil.
   Neither is a transition on transform, so hover transforms stay free. */

export function Card({
  className,
  glass = false,
  sweep = false,
  /**
   * Own an opaque fill of its own.
   *
   * Pass `false` when the card is the surface of a `Spotlight`: the spotlight
   * wrapper then supplies the background so the cursor glow is not painted
   * over by this element. The visible colour is identical either way.
   */
  surface = true,
  as: Tag = "div",
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  glass?: boolean;
  sweep?: boolean;
  surface?: boolean;
  as?: React.ElementType;
}) {
  return (
    <Tag
      className={cn(
        "relative isolate rounded-card border border-line",
        surface && "bg-surface",
        "transition-[border-color,background-color,box-shadow] duration-500 ease-out",
        glass && "glass",
        sweep && "border-sweep",
        className,
      )}
      {...props}
    />
  );
}

/* Bento container: 12-col grid on desktop, 1-col on mobile. */
export function BentoGrid({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-3 md:grid-cols-12 md:gap-4",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* Tag / chip. Mono, uppercase, small. */
export function Tag({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "type-mono inline-flex items-center rounded-pill border border-line px-2.5 py-1 text-fg-muted",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

/* Section shell: consistent rhythm, index label, and a hairline top edge. */
export function Section({
  id,
  className,
  children,
  label,
}: {
  id: string;
  className?: string;
  children: React.ReactNode;
  /** When set, links the section to a heading with `id={`${id}-heading`}`. */
  label?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "section-glow-top relative scroll-mt-24 border-t border-line",
        className,
      )}
      aria-labelledby={label ? `${id}-heading` : undefined}
    >
      <div className="gutter shell py-[clamp(2.5rem,6vw,5.5rem)]">{children}</div>
    </section>
  );
}

/* Section heading: mono index + oversized display title. */
export function SectionHeading({
  index,
  eyebrow,
  title,
  lede,
  className,
  id,
}: {
  index: string;
  eyebrow: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div className={cn("mb-[clamp(2.5rem,5vw,4.5rem)]", className)}>
      <div className="mb-6 flex items-center gap-3">
        <span className="type-mono rounded-pill border border-accent/40 bg-accent/10 px-2.5 py-1 text-accent tabular-nums">
          {index}
        </span>
        <span className="type-mono text-fg-muted">{eyebrow}</span>
        <span
          aria-hidden="true"
          className="h-px flex-1 origin-left bg-gradient-to-r from-accent/70 via-violet-400/40 to-transparent [animation:rule-in_1.1s_cubic-bezier(0.16,1,0.3,1)_both]"
        />
      </div>
      <h2
        id={id}
        className="type-display max-w-[16ch] text-h2 text-fg"
      >
        {title}
      </h2>
      {lede ? (
        <p className="mt-6 max-w-[52ch] text-lead text-fg-muted">{lede}</p>
      ) : null}
    </div>
  );
}

/* Placeholder badge. Everything unknown renders inside one of these so it is
   impossible to mistake generated filler for verified information. */
export function PlaceholderNote({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "flex items-start gap-2.5 rounded-lg border border-dashed border-accent/45 bg-accent/[0.055] px-3.5 py-3",
        "text-[0.8125rem] leading-relaxed text-fg-muted",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="type-mono mt-px shrink-0 text-accent"
      >
        TBD
      </span>
      <span>{children}</span>
    </p>
  );
}
