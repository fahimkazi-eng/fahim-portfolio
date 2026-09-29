"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-card border border-line bg-surface p-8">
      <p className="type-mono text-accent">Dashboard error</p>
      <h1 className="type-display mt-3 text-h3 text-fg">
        This view failed to load.
      </h1>
      <p className="mt-4 max-w-[54ch] text-body text-fg-muted">
        Most often this is a dropped database connection. Retrying is safe —
        nothing was written.
      </p>

      {error.digest ? (
        <p className="type-mono mt-5 inline-block rounded-pill border border-line px-3 py-1.5 text-fg-subtle">
          ref: {error.digest}
        </p>
      ) : null}

      <div className="mt-7 flex flex-wrap gap-3">
        <Button size="md" onClick={reset}>
          Retry
        </Button>
        <Button asChild size="md" variant="outline">
          <Link href="/admin">Back to overview</Link>
        </Button>
      </div>
    </div>
  );
}
