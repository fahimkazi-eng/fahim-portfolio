"use client";

import * as Tabs from "@radix-ui/react-tabs";
import type { UsesItem } from "@/lib/db/schema";
import {
  PlaceholderNote,
  Section,
  SectionHeading,
} from "@/components/ui/card";
import { SplitText } from "@/components/animations/split-text";
import { cn } from "@/lib/utils";

/* ==========================================================================
   Uses (11) — the kit.

   One tab per real category, plus an honest Hardware tab. Every row is real
   and admin-editable; the notes are one-line reasons and are left blank
   rather than invented. The Hardware tab exists so the category is present
   without ever claiming a device the owner has not confirmed — it says so
   plainly and points at the admin dashboard.

   Tabs are Radix, so arrow-key roving focus and the correct ARIA wiring come
   for free; the visual language stays the Work filter pill.
   ========================================================================== */

/** Display labels for the stored categories. The data keeps its own names. */
const LABELS: Record<string, string> = {
  Frontend: "Software",
  "Backend & data": "Tools",
  "Motion & WebGL": "Motion & WebGL",
};

const HARDWARE_TAB = "__hardware";

export function UsesSection({ items }: { items: UsesItem[] }) {
  /* Preserve the query's category order; group without mutating the list. */
  const categories: string[] = [];
  const grouped = new Map<string, UsesItem[]>();
  for (const item of items) {
    if (!grouped.has(item.category)) {
      categories.push(item.category);
      grouped.set(item.category, []);
    }
    grouped.get(item.category)!.push(item);
  }

  const tabs = [
    ...categories.map((category) => ({
      value: category,
      label: LABELS[category] ?? category,
    })),
    { value: HARDWARE_TAB, label: "Hardware" },
  ];

  return (
    <Section id="uses">
      <SectionHeading
        index="/ 11"
        eyebrow="Uses"
        title={<SplitText text="The kit." duration={1} />}
        lede="Software I actually run this site and its products on — nothing claimed that isn't in the build. Hardware stays an honest blank until there's something truthful to say."
      />

      {items.length === 0 ? (
        <PlaceholderNote>
          No items yet — add what you use from the admin dashboard. Only
          verified tools make the list.
        </PlaceholderNote>
      ) : (
        <Tabs.Root defaultValue={tabs[0].value}>
          <Tabs.List
            aria-label="Uses categories"
            className="flex flex-wrap items-center gap-2 border-b border-line pb-4"
          >
            {tabs.map((tab) => (
              <Tabs.Trigger
                key={tab.value}
                value={tab.value}
                className={cn(
                  "inline-flex h-10 items-center rounded-pill border px-4 text-[0.8125rem] uppercase tracking-[0.06em] text-fg-muted transition-colors duration-300",
                  "border-line hover:border-line-strong hover:text-fg",
                  "data-[state=active]:border-accent data-[state=active]:bg-accent/10 data-[state=active]:text-fg",
                )}
              >
                {tab.label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          {categories.map((category) => (
            <Tabs.Content
              key={category}
              value={category}
              className="mt-[clamp(1.75rem,4vw,3rem)] focus-visible:outline-none"
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {grouped.get(category)!.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-card border border-line bg-surface p-6 transition-colors duration-300 hover:border-accent/50"
                  >
                    <p className="type-display text-[1.0625rem] tracking-tight text-fg">
                      {item.name}
                    </p>
                    {item.note ? (
                      <p className="mt-2 text-[0.8125rem] leading-relaxed text-fg-muted">
                        {item.note}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </Tabs.Content>
          ))}

          <Tabs.Content
            value={HARDWARE_TAB}
            className="mt-[clamp(1.75rem,4vw,3rem)] focus-visible:outline-none"
          >
            <div className="rounded-card border border-dashed border-line bg-surface/50 p-8">
              <p className="type-mono text-[0.6875rem] uppercase tracking-[0.16em] text-fg-subtle">
                Hardware
              </p>
              <p className="mt-3 max-w-[52ch] text-body leading-relaxed text-fg-muted">
                No hardware list yet. The machine and peripherals are a
                day-to-day tool, not a claim worth inflating — this tab fills in
                honestly once there is a setup worth documenting.
              </p>
            </div>
          </Tabs.Content>
        </Tabs.Root>
      )}
    </Section>
  );
}
