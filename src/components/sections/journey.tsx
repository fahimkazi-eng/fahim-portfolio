import type { Education, Experience } from "@/lib/db/schema";
import { Section, SectionHeading } from "@/components/ui/card";
import { Stagger } from "@/components/animations/motion-primitives";
import { SplitText } from "@/components/animations/split-text";
import { TimelineStrip } from "./timeline-strip";
import { journeyStages } from "@/lib/site";

/* ==========================================================================
   Journey (03) — reference composition.

   Top: the identity arc — six honest phases with a connecting line.
   Below: the DB-driven timeline (education + experience) with scroll
   activation. Facts come from the database; the arc is editable copy, with
   every claim kept to what is true (degree, shipped products, direction).
   ========================================================================== */

type Marker = {
  year: string;
  title: string;
  org?: string;
  current?: boolean;
  body?: React.ReactNode;
};

/** "2023 — 2024" → "2023–2024", collapsing ongoing roles to "now". */
function toMarker(
  item: Experience | Education,
  kind: "experience" | "education",
): Marker {
  if (kind === "education") {
    const edu = item as Education;
    return {
      year: edu.current ? `${edu.startYear}—now` : `${edu.startYear}–${edu.endYear}`,
      title: edu.degree,
      org: edu.institution,
      current: edu.current,
      body: edu.description ? <p>{edu.description}</p> : null,
    };
  }

  const exp = item as Experience;
  return {
    year: exp.current ? `${exp.startDate}—now` : `${exp.startDate}–${exp.endDate}`,
    title: exp.role,
    org: exp.organization,
    current: exp.current,
    body: exp.description ? (
      <>
        <p>{exp.description}</p>
        {exp.highlights.length > 0 ? (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {exp.highlights.map((h) => (
              <li key={h} className="flex gap-2.5 text-[0.875rem] leading-relaxed">
                <span
                  aria-hidden="true"
                  className="mt-2 size-1 shrink-0 rounded-full bg-accent"
                />
                {h}
              </li>
            ))}
          </ul>
        ) : null}
      </>
    ) : null,
  };
}

export function JourneySection({
  experiences,
  educations,
}: {
  experiences: Experience[];
  educations: Education[];
}) {
  // Newest first: the ongoing education leads.
  const markers: Marker[] = [
    ...educations.map((e) => toMarker(e, "education")),
    ...experiences.map((e) => toMarker(e, "experience")),
  ];

  return (
    <Section id="journey">
      <SectionHeading
        index="/ 03"
        eyebrow="Journey"
        title={<SplitText text="My journey." duration={1} />}
        lede="Six phases of how the work got here — then the record, education and experience, straight from the database."
      />

      {/* ---- Identity arc ---- */}
      <Stagger
        as="ol"
        step={0.06}
        className="relative space-y-6 border-l border-line pl-7 md:grid md:grid-cols-3 md:gap-x-6 md:gap-y-10 md:space-y-0 md:border-l-0 md:pl-0 xl:grid-cols-6"
      >
        {journeyStages.map((stage) => (
          <li key={stage.index} className="relative md:border-t md:border-line md:pt-5">
            {/* Connection node */}
            <span
              aria-hidden="true"
              className="absolute left-0 top-1 size-2 -translate-x-1/2 rounded-full border border-accent bg-canvas md:left-0 md:top-0 md:-translate-y-1/2"
            />
            <p className="type-mono text-accent">{stage.index}</p>
            <h3 className="mt-1.5 font-display text-h4 tracking-tight text-fg">
              {stage.title}
            </h3>
            <p className="mt-2 text-[0.875rem] leading-relaxed text-fg-muted">
              {stage.body}
            </p>
          </li>
        ))}
      </Stagger>

      {/* ---- DB record ---- */}
      {markers.length > 0 ? (
        <div className="mt-[clamp(3rem,7vw,5.5rem)]">
          <TimelineStrip markers={markers} />
        </div>
      ) : null}

      {/* No filler is generated for a role the owner has not described. The
          timeline above already carries role, organisation and dates — the
          whole verifiable claim. Descriptions added in admin render
          themselves. */}
    </Section>
  );
}