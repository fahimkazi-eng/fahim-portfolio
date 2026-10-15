"use client";

import type { Project } from "@/lib/db/schema";
import { Section, SectionHeading } from "@/components/ui/card";
import { Reveal } from "@/components/animations/motion-primitives";
import {
  WorksWheel,
  type WorksWheelItem,
} from "@/components/ui/works-wheel";

/* ==========================================================================
   The works wheel (05) — the portfolio index as a drum you turn.

   Sits directly under the featured grid and carries the same curated set
   (featured when there is one, otherwise everything published), so the two
   never disagree about what the work is. Each card links into its case
   study; the cover falls back to real stock art when a project has been
   saved without an image so the ring never renders empty cards.
   ========================================================================== */

/** Stock covers for projects saved without an image — real Unsplash photos. */
const FALLBACK_COVERS = [
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=70",
  "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=70",
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=900&q=70",
  "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=900&q=70",
  "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?auto=format&fit=crop&w=900&q=70",
  "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=900&q=70",
  "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=900&q=70",
  "https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=900&q=70",
];

export function WorksWheelSection({ projects }: { projects: Project[] }) {
  const published = projects.filter((p) => p.published);
  const featured = published.filter((p) => p.featured);
  const list = featured.length ? featured : published;

  /* An empty wheel is a broken control — the section simply does not render
     until there is work to turn. */
  if (list.length === 0) return null;

  const items: WorksWheelItem[] = list.map((project, i) => ({
    title: project.title,
    image:
      project.imageUrl ||
      FALLBACK_COVERS[i % FALLBACK_COVERS.length],
    href: `/work/${project.slug}`,
  }));

  return (
    <Section id="wheel">
      <SectionHeading
        index="/ 05"
        eyebrow="The whole index"
        title="Turn the wheel."
        lede="Scroll, drag, or arrow-key your way through the work — the drum carries each piece round to the front."
      />

      <Reveal>
        {/* The frame is the wheel's stage: fixed height so the drum has a
            picture plane, rounded and edged to match the site's cards. */}
        <div className="bg-surface/30 relative h-[min(78vh,42rem)] min-h-[24rem] overflow-hidden rounded-card border border-line">
          <WorksWheel items={items} label="Works '26" action="View" />
        </div>
      </Reveal>
    </Section>
  );
}
