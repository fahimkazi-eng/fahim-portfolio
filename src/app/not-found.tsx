import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="relative grid min-h-svh place-items-center overflow-hidden px-5 py-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(45%_40%_at_50%_40%,color-mix(in_oklab,var(--accent)_12%,transparent),transparent_70%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-40 [background-image:linear-gradient(to_right,var(--grid-line)_1px,transparent_1px),linear-gradient(to_bottom,var(--grid-line)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(60%_50%_at_50%_50%,black,transparent)]"
      />

      <div className="max-w-xl text-center">
        <p className="type-mono text-accent">404</p>
        <h1 className="type-display mt-4 text-h1 leading-[0.85] text-fg">
          This page doesn&rsquo;t exist.
        </h1>
        <p className="type-mono mt-6 text-fg-muted">But this one does.</p>
        <p className="mx-auto mt-6 max-w-[46ch] text-lead text-fg-muted">
          The link may be out of date, or the case study it pointed at is still
          a draft and has not been published yet.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/">Return to Home →</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/#work">See the work</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
