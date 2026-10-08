import { Download, FileText } from "lucide-react";
import {
  PlaceholderNote,
  Section,
  SectionHeading,
} from "@/components/ui/card";
import { SplitText } from "@/components/animations/split-text";
import { site } from "@/lib/site";

/* ==========================================================================
   Resume (13) — closes the page.

   DB-driven: when a `resume_url` setting exists in site_settings it wins for
   both actions. Until one is uploaded the buttons degrade to an honest
   mailto request — no fake PDF, no invented file.
   ========================================================================== */

type ResumeSectionProps = {
  resumeUrl: string | null;
};

export function ResumeSection({ resumeUrl }: ResumeSectionProps) {
  const viewHref = resumeUrl ?? `mailto:${site.email}?subject=${encodeURIComponent(
    `Resume request — ${site.name}`,
  )}`;
  const downloadHref = `mailto:${site.email}?subject=${encodeURIComponent(
    resumeUrl ? `Resume download — ${site.name}` : `Please send your resume — ${site.name}`,
  )}`;

  return (
    <Section id="resume">
      <SectionHeading
        index="/ 13"
        eyebrow="Resume"
        title={<SplitText text="The one-page version." duration={1} />}
        lede="The whole career story, compressed. Real dates, real numbers — the same facts as every other section on this page, just denser."
      />

      <div className="flex flex-col items-start justify-between gap-8 overflow-hidden rounded-card border border-line bg-surface p-7 md:flex-row md:items-center">
        <div>
          <p className="type-mono text-accent">Kazi Fahim</p>
          <p className="mt-2 max-w-[44ch] text-body leading-relaxed text-fg-muted">
            {`${site.roleLine} — details identical to the page above, on one page.`}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <a
            href={viewHref}
            data-cursor="view"
            className="inline-flex h-12 items-center rounded-pill bg-accent px-6 text-[0.9rem] font-medium text-accent-fg transition-[filter] duration-300 hover:brightness-110"
          >
            <FileText className="mr-2 size-4" strokeWidth={2} />
            View resume
          </a>
          <a
            href={downloadHref}
            data-cursor="view"
            className="inline-flex h-12 items-center rounded-pill border border-line-strong px-6 text-[0.9rem] font-medium text-fg transition-colors duration-300 hover:border-accent hover:text-accent"
          >
            <Download className="mr-2 size-4" strokeWidth={2} />
            Get a copy
          </a>
        </div>
      </div>

      {resumeUrl ? null : (
        <PlaceholderNote className="mt-4">
          No PDF is uploaded to the site yet — both buttons email a request
          instead. Upload one as the{" "}
          <code className="text-fg">resume_url</code> setting to link the file
          directly.
        </PlaceholderNote>
      )}
    </Section>
  );
}