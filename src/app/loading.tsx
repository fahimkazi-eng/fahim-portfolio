/**
 * Streaming fallback for the public site.
 *
 * Deliberately quiet: a skeleton that mirrors the hero's shape so the layout
 * does not jump when data arrives, rather than a spinner over a blank page.
 */
export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="min-h-svh" aria-label="Loading page">
      <span className="sr-only">Loading…</span>

      {/* Progress hairline — same position as the ScrollProgress bar, so the
          handover from loading to loaded is not a jump. */}
      <div
        aria-hidden="true"
        className="fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-accent/60 [animation:load-bar_1.4s_ease-in-out_infinite_alternate] motion-reduce:[animation:none]"
      />

      <div className="gutter shell pt-[clamp(7rem,16vw,13rem)]">
        <div className="max-w-[20ch] space-y-3">
          <div className="h-[clamp(2.4rem,7vw,6rem)] w-full rounded-lg bg-fg/[0.06]" />
          <div className="h-[clamp(2.4rem,7vw,6rem)] w-3/5 rounded-lg bg-fg/[0.04]" />
        </div>

        <div className="mt-8 h-5 w-64 max-w-full rounded-full bg-fg/[0.05]" />

        <div className="mt-16 grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="h-64 rounded-card bg-fg/[0.04] lg:col-span-7" />
          <div className="h-64 rounded-card bg-fg/[0.03] lg:col-span-5" />
        </div>
      </div>
    </div>
  );
}
