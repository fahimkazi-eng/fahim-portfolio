import type { UsesItem } from "@/lib/db/schema";
import {
  PlaceholderNote,
  Section,
  SectionHeading,
} from "@/components/ui/card";
import { SplitText } from "@/components/animations/split-text";

/* ==========================================================================
   Uses (11) — the kit. Every row is real and admin-editable; the notes are
   one-line reasons, and are left blank rather than invented. Hardware is
   deliberately omitted until there is something truthful to say about it.
   ========================================================================== */

type UsesSectionProps = {
  items: UsesItem[];
};

export function UsesSection({ items }: UsesSectionProps) {
  /* Preserve the query's category order; group without mutating the list. */
  const categories = [] as string[];
  const grouped = new Map<string, UsesItem[]>();
  for (const item of items) {
    if (!grouped.has(item.category)) {
      categories.push(item.category);
      grouped.set(item.category, []);
    }
    grouped.get(item.category)!.push(item);
  }

  return (
    <Section id="uses">
      <SectionHeading
        index="/ 11"
        eyebrow="Uses"
        title={<SplitText text="The kit." duration={1} />}
        lede="Software I actually run this site and its products on — nothing claimed that isn't in the build. Hardware stays off the list until there's something truthful to say."
      />

      {items.length === 0 ? (
        <PlaceholderNote>
          No items yet — add what you use from the admin dashboard. Only
          verified tools make the list.
        </PlaceholderNote>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {categories.map((category) => (
            <div
              key={category}
              className="rounded-card border border-line bg-surface p-6"
            >
              <p className="type-mono text-[0.6875rem] uppercase tracking-[0.16em] text-fg-subtle">
                {category}
              </p>
              <ul className="mt-4 divide-y divide-line">
                {grouped.get(category)!.map((item) => (
                  <li key={item.id} className="py-3 first:pt-0 last:pb-0">
                    <p className="type-display text-[1.0625rem] tracking-tight text-fg">
                      {item.name}
                    </p>
                    {item.note ? (
                      <p className="mt-1 text-[0.8125rem] leading-relaxed text-fg-muted">
                        {item.note}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}