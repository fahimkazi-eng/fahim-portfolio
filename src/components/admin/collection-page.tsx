import type { ReactNode } from "react";

/**
 * Generic "list + create" admin screen, shared by the four simpler content
 * types so none of them needs a bespoke page. Properly generic — no casts.
 */
export function CollectionPage<T extends { id: number }>({
  title,
  eyebrow,
  description,
  createLabel,
  items,
  emptyText,
  form,
  renderItem,
}: {
  title: string;
  eyebrow: string;
  description: string;
  createLabel: string;
  items: T[];
  emptyText: string;
  form: ReactNode;
  renderItem: (item: T) => ReactNode;
}) {
  return (
    <div className="space-y-7">
      <header>
        <p className="type-mono text-accent">{eyebrow}</p>
        <h1 className="type-display mt-2 text-h2 text-fg">{title}</h1>
        <p className="mt-2 max-w-[56ch] text-body text-fg-muted">{description}</p>
      </header>

      {items.length === 0 ? (
        <p className="rounded-card border border-dashed border-line-strong p-6 text-center text-body text-fg-muted">
          {emptyText}
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>{renderItem(item)}</li>
          ))}
        </ul>
      )}

      <section>
        <h2 className="mb-4 font-display text-h4 tracking-tight text-fg">
          {createLabel}
        </h2>
        {form}
      </section>
    </div>
  );
}
