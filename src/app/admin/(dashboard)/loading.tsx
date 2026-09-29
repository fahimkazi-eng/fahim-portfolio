/** Loading skeleton for the admin dashboard. Static blocks, no pulse. */
export default function AdminLoading() {
  return (
    <div role="status" aria-live="polite" aria-label="Loading dashboard">
      <span className="sr-only">Loading…</span>

      <div className="h-4 w-32 rounded-full bg-fg/[0.05]" />
      <div className="mt-3 h-10 w-64 max-w-full rounded-lg bg-fg/[0.05]" />

      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-card bg-fg/[0.04]" />
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-card bg-fg/[0.03]" />
        ))}
      </div>
    </div>
  );
}
