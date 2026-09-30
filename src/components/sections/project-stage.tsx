"use client";

import { useEffect, useRef } from "react";
import type { Project } from "@/lib/db/schema";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePrefersReducedMotion } from "@/components/animations/motion-primitives";
import { ProjectSignature } from "./project-signature";

/* ==========================================================================
   ProjectStage

   The case study's second visual presentation.

   The cover shows the product's own media. This band is the other half: an
   immersive, full-bleed moment built from the project's GENERATIVE signature
   with its real metadata laid over it in depth.

   It is not a second screenshot and it is deliberately not a mock-up of the
   product's interface. Nothing here invents a feature, a number, a user or a
   technology: the year, the role and the technology list all come straight
   off the project row, and a project with none of them renders an honest
   empty state rather than filler.

   Motion ownership:
     - the signature's own rAF loop draws the canvas pixels
     - this component's ScrollTrigger owns yPercent on the METADATA only
   They are different elements, so neither can fight the other.
   ========================================================================== */

export function ProjectStage({ project }: { project: Project }) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const reduced = usePrefersReducedMotion();

  const chips = project.tech.slice(0, 8);

  /* Metadata drifts at rates derived from its own index, so the block reads
     as a volume rather than as a flat caption sliding past. One trigger for
     the whole set — nine chips would otherwise mean nine triggers. */
  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduced) return;
    gsap.registerPlugin(ScrollTrigger);

    const items = Array.from(
      root.querySelectorAll<HTMLElement>("[data-stage-chip]"),
    );
    if (!items.length) return;

    const tween = gsap.to(items, {
      yPercent: (i) => -6 - (i % 4) * 7,
      ease: "none",
      scrollTrigger: {
        trigger: root,
        start: "top bottom",
        end: "bottom top",
        scrub: 0.6,
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      gsap.set(items, { clearProps: "transform" });
    };
  }, [reduced]);

  return (
    <div
      ref={rootRef}
      className="relative isolate overflow-hidden border-y border-line bg-surface"
    >
      {/* The generative mark, large and low-intensity, behind everything. */}
      <div className="absolute inset-0 -z-10 opacity-70">
        <ProjectSignature
          seed={project.slug}
          title={project.title}
          intensity={0.7}
          className="h-full w-full"
        />
      </div>

      <div className="gutter shell relative flex min-h-[min(78svh,44rem)] flex-col justify-between gap-12 py-[clamp(3.5rem,8vw,7rem)]">
        {/* top: identity, real data only */}
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="type-mono text-accent">In motion</p>
            <p className="type-display mt-4 text-h3 leading-[0.9] text-fg">
              {project.title}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-x-10 gap-y-4 sm:grid-cols-3">
            {project.year ? (
              <div>
                <dt className="type-mono text-fg-subtle">Year</dt>
                <dd className="mt-1.5 text-body text-fg tabular-nums">
                  {project.year}
                </dd>
              </div>
            ) : null}
            {project.role ? (
              <div>
                <dt className="type-mono text-fg-subtle">Role</dt>
                <dd className="mt-1.5 max-w-[18ch] text-body text-fg">
                  {project.role}
                </dd>
              </div>
            ) : null}
            {project.liveUrl ? (
              <div>
                <dt className="type-mono text-fg-subtle">Status</dt>
                <dd className="mt-1.5 text-body text-fg">Live</dd>
              </div>
            ) : null}
          </dl>
        </div>

        {/* bottom: technology, or an honest gap */}
        {chips.length ? (
          <ul className="flex max-w-[52rem] flex-wrap gap-2.5">
            {chips.map((tech) => (
              <li
                key={tech}
                data-stage-chip
                className="type-mono rounded-pill border border-line bg-canvas/60 px-3.5 py-1.5 text-fg-muted backdrop-blur-sm will-change-transform"
              >
                {tech}
              </li>
            ))}
          </ul>
        ) : (
          <p className="type-mono max-w-[46ch] leading-relaxed text-fg-subtle">
            No technology list has been recorded for {project.title} yet — add
            it in the admin dashboard and these chips will appear here.
          </p>
        )}

      </div>
    </div>
  );
}
