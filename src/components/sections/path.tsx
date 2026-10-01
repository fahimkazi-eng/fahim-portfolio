import type { Education, Experience } from "@/lib/db/schema";
import { Card, Section, SectionHeading } from "@/components/ui/card";
import { Stagger } from "@/components/animations/motion-primitives";
import { SplitText } from "@/components/animations/split-text";
import { TimelineStrip } from "./timeline-strip";
import { site } from "@/lib/site";

/* ==========================================================================
   Path — experience and education as a single sticky-railed timeline.
   Facts come from the database so they can be corrected without a deploy.
   ========================================================================== */

type Marker = {
  year: string;
  title: string;
  org?: string;
  current?: boolean;
  body?: React.ReactNode;
};

/** "2023 — 2024" → "2023–2024", collapsing the current role to "Present". */
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

export function PathSection({
  experiences,
  educations,
}: {
  experiences: Experience[];
  educations: Education[];
}) {
  // Newest first: the education entry is ongoing so it leads.
  const markers: Marker[] = [
    ...educations.map((e) => toMarker(e, "education")),
    ...experiences.map((e) => toMarker(e, "experience")),
  ];

  return (
    <Section id="path">
      <SectionHeading
        index="04"
        eyebrow="Path"
        title={<SplitText text="Where the practice comes from." duration={1} />}
        lede="A degree in progress, and two years of being the person customers and volunteers actually talk to."
      />

      {markers.length > 0 ? <TimelineStrip markers={markers} /> : null}

      {/* Education + languages as a bento pair */}
      <div className="mt-[clamp(3rem,7vw,6rem)] grid grid-cols-1 gap-4 md:grid-cols-12">
        <Stagger className="contents" step={0.08}>
          <Card sweep className="p-7 md:col-span-7">
            <p className="type-mono mb-4 text-accent">Education</p>
            {educations.length ? (
              <ul className="space-y-5">
                {educations.map((edu) => (
                  <li key={edu.id}>
                    <p className="font-display text-h4 tracking-tight text-fg">
                      {edu.degree}
                    </p>
                    <p className="type-mono mt-1.5 text-fg-muted">
                      {edu.institution}
                      {edu.location ? ` · ${edu.location}` : ""}
                    </p>
                    <p className="type-mono mt-1 text-fg-subtle">
                      {edu.startYear} — {edu.current ? "Present" : edu.endYear}
                    </p>
                    {edu.description ? (
                      <p className="mt-3 max-w-[52ch] text-body leading-relaxed text-fg-muted">
                        {edu.description}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-body text-fg-muted">Not yet added.</p>
            )}
          </Card>

          <Card sweep className="p-7 md:col-span-5">
            <p className="type-mono mb-4 text-accent">Languages</p>
            {/* No levels, percentages or ordering. The owner speaks these three;
                how fluently is not something to assert on their behalf. Each
                gets the same treatment, so the list cannot be misread as a
                ranking. */}
            <ul className="space-y-3">
              {site.languages.map((lang) => (
                <li
                  key={lang}
                  className="flex items-center gap-3 border-b border-line pb-3 last:border-0 last:pb-0"
                >
                  <span
                    aria-hidden="true"
                    className="size-1.5 shrink-0 rounded-full bg-accent"
                  />
                  <span className="text-body text-fg">{lang}</span>
                </li>
              ))}
            </ul>
          </Card>
        </Stagger>
      </div>

      {/* No filler is generated for a role the owner has not described. The
          timeline above already carries the role, organisation and dates,
          which is the whole verifiable claim — so when there is nothing more
          to say, the section simply ends. Descriptions and highlights added
          in the admin render themselves. */}
    </Section>
  );
}
