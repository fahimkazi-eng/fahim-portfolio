import type { Metadata } from "next";
import { HorizonExperience } from "@/components/effects/horizon-hero";
import { HORIZON_PANELS } from "@/lib/horizon";

/* The Horizon scene owns the whole scroll of this route (three viewport-tall
   panels drive the camera), so it is deliberately a standalone page rather
   than a section on the homepage. Reachable from the Lab.

   No `revalidate` / database work here: the page is fully static. */

export const metadata: Metadata = {
  title: "Horizon",
  description:
    "An interactive Three.js scene: scroll through HORIZON, COSMOS and INFINITY.",
  /* An experiment, not portfolio content: kept out of search results so it
     never competes with the real pages. */
  robots: { index: false, follow: true },
};

export default function HorizonPage() {
  return (
    <main id="main">
      <HorizonExperience />

      {/* Screen-reader summary: the visual scene is decorative, but its copy
          is real content and should be readable. */}
      <p className="sr-only">
        {HORIZON_PANELS.map(
          (panel) => `${panel.title}. ${panel.line1} ${panel.line2}`,
        ).join(" ")}
      </p>
    </main>
  );
}
