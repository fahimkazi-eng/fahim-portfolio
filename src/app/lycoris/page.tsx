import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import LycorisSpecimen from "@/components/ui/lycoris-specimen";

/* A self-contained type specimen: one sticky stage over a ~700svh board whose
   six frames are driven entirely by scroll. Like /horizon it owns its own
   scroll, so it is a standalone route rather than a homepage section.
   Reachable from the Lab.

   No `revalidate` and no database work here: the page is fully static. */

export const metadata: Metadata = {
  title: "Lycoris",
  description:
    "Kazi Fahim — an interactive, scroll-scrubbed type specimen built around a procedurally modelled red chrome spider lily in WebGL.",
  /* An experiment, not portfolio content: kept out of search results so it
     never competes with the real pages. */
  robots: { index: false, follow: true },
};

export default function LycorisPage() {
  return (
    <main id="main">
      <Link
        href="/#lab"
        className="type-mono fixed top-5 right-5 z-30 inline-flex items-center gap-2 rounded-pill border border-line bg-canvas/80 px-3.5 py-2 text-fg-muted shadow-lg backdrop-blur-sm transition-colors duration-300 hover:border-accent/50 hover:text-fg sm:right-8"
      >
        <ArrowLeft aria-hidden="true" className="size-3.5" />
        Back to portfolio
      </Link>

      <LycorisSpecimen />

      {/* Screen-reader summary: the board is a visual artefact, but its copy is
          real content and should be legible without the canvas. */}
      <p className="sr-only">
        Lycoris type specimen. A scroll-scrubbed sequence in six frames — cover,
        crown, specimen, fan, bloom and ligatures — presented around a
        procedurally modelled red spider lily rendered in WebGL.
      </p>
    </main>
  );
}
