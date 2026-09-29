"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/**
 * Root error boundary.
 *
 * `reset` (the prop) is what Next 16 passes for retrying a segment — there
 * is no `retry` name to look for. The digest is shown because it is the only
 * handle a visitor can give a developer to find the matching server log.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Keep it in the console too; the boundary is not a logging system.
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-svh place-items-center px-5 py-20">
      <div className="max-w-lg text-center">
        <p className="type-mono text-accent">Something broke</p>
        <h1 className="type-display mt-4 text-h2 text-fg">
          This section failed to load.
        </h1>
        <p className="mt-5 text-body text-fg-muted">
          The rest of the site is unaffected. Reloading usually clears it; if it
          does not, the reference below identifies the failure in the logs.
        </p>

        {error.digest ? (
          <p className="type-mono mt-6 inline-block rounded-pill border border-line px-3 py-1.5 text-fg-subtle">
            ref: {error.digest}
          </p>
        ) : null}

        <div className="mt-9 flex justify-center">
          <Button size="lg" onClick={reset}>
            Try again
          </Button>
        </div>
      </div>
    </main>
  );
}
