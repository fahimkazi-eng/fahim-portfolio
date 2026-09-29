"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { usePrefersReducedMotion } from "@/components/animations/motion-primitives";
import { cn } from "@/lib/utils";

/* ==========================================================================
   TimelineStrip — a pinned year rail.

   A left-hand rail holds the years; the right column scrolls. The active
   year highlights as its row crosses the middle of the viewport. This is the
   storytelling device used for the "Path" (experience + education) section.

   The rail is `position: sticky`, not GSAP-pinned: native sticky is cheaper,
   survives resize without a refresh, and degrades perfectly.
   ========================================================================== */

type Marker = {
  year: string;
  title: string;
  org?: string;
  body?: ReactNode;
  current?: boolean;
};

export function TimelineStrip({
  markers,
  className = "",
}: {
  markers: Marker[];
  className?: string;
}) {
  const listRef = useRef<HTMLOListElement | null>(null);
  const reduced = usePrefersReducedMotion();

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list || reduced) return;

    const rows = Array.from(list.children) as HTMLElement[];
    if (!rows.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const row = entry.target as HTMLElement;
          const active = entry.isIntersecting && entry.intersectionRatio > 0.4;
          row.dataset.active = active ? "true" : "false";
        }
      },
      { rootMargin: "-42% 0px -42% 0px", threshold: [0, 0.4, 1] },
    );

    rows.forEach((row) => observer.observe(row));
    return () => observer.disconnect();
  }, [reduced]);

  return (
    <div className={cn("grid grid-cols-1 gap-6 md:grid-cols-12 md:gap-10", className)}>
      {/* Year rail */}
      <div className="md:col-span-3">
        <div className="sticky top-28">
          <p className="type-mono mb-4 text-fg-subtle">Timeline</p>
          <ol ref={listRef} className="space-y-1 border-l border-line pl-4">
            {markers.map((marker) => (
              <li
                key={marker.year + marker.title}
                data-active="false"
                className="group transition-colors duration-500"
              >
                <span className="type-mono block text-fg-subtle transition-colors duration-500 group-data-[active=true]:text-accent">
                  {marker.year}
                </span>
                <span className="block text-[0.8125rem] text-fg-muted transition-colors duration-500 group-data-[active=true]:text-fg">
                  {marker.title}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Rows */}
      <div className="md:col-span-9">
        <ol className="space-y-px overflow-hidden rounded-card border border-line bg-line">
          {markers.map((marker) => (
            <li
              key={`row-${marker.year}-${marker.title}`}
              data-active="false"
              className={cn(
                "group relative bg-canvas p-6 transition-colors duration-500 md:p-8",
                "data-[active=true]:bg-surface",
              )}
            >
              <span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 w-[2px] origin-top scale-y-0 bg-accent transition-transform duration-500 ease-out group-data-[active=true]:scale-y-100"
              />
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="type-display text-h3 leading-none text-fg">
                  {marker.year}
                </span>
                {marker.current ? (
                  <span className="type-mono rounded-pill border border-accent/40 px-2 py-0.5 text-accent">
                    Present
                  </span>
                ) : null}
              </div>
              <h3 className="mt-2 font-display text-h4 tracking-tight text-fg">
                {marker.title}
              </h3>
              {marker.org ? (
                <p className="type-mono mt-1.5 text-fg-muted">{marker.org}</p>
              ) : null}
              {marker.body ? (
                <div className="mt-3 max-w-[62ch] text-body leading-relaxed text-fg-muted">
                  {marker.body}
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
