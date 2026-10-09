import { FloatingNav } from "@/components/ui/nav";
import { Hero } from "@/components/sections/hero";
import { AboutSection } from "@/components/sections/about";
import { JourneySection } from "@/components/sections/journey";
import { StackSection } from "@/components/sections/stack";
import { WorkSection } from "@/components/sections/work";
import { CurrentlyExploringSection } from "@/components/sections/currently-exploring";
import { LabSection } from "@/components/sections/lab";
import { ArchiveSection } from "@/components/sections/archive";
import { ServicesSection } from "@/components/sections/services";
import { NotesSection } from "@/components/sections/notes";
import { UsesSection } from "@/components/sections/uses";
import { ResumeSection } from "@/components/sections/resume";
import { ContactSection } from "@/components/sections/contact";
import { Footer } from "@/components/sections/footer";
import {
  getEducations,
  getExperiences,
  getPublishedPosts,
  getPublishedProjects,
  getServices,
  getSetting,
  getSkills,
  getUsesItems,
} from "@/lib/db/queries";
import { site } from "@/lib/site";
import { portraitAssetExists } from "@/lib/portrait-asset";
import { resumeAssetExists } from "@/lib/resume-asset";
import { buildPersonSchema, buildWebSiteSchema } from "@/lib/seo";

/* --------------------------------------------------------------------------
   One request, one round of parallel queries, one render. Every section
   below is a Server Component; the only client boundaries are the ones
   inside them (nav, hero canvas, cursor, form, motion primitives).
   -------------------------------------------------------------------------- */

export const revalidate = 60;

export default async function HomePage() {
  const [
    projects,
    skills,
    experiences,
    educations,
    services,
    posts,
    usesItems,
    resumeUrl,
  ] = await Promise.all([
    getPublishedProjects(),
    getSkills(),
    getExperiences(),
    getEducations(),
    getServices(),
    getPublishedPosts(),
    getUsesItems(),
    getSetting("resume_url"),
  ]);

  const personSchema = buildPersonSchema({
    projects,
    experiences,
    educations,
  });
  const siteSchema = buildWebSiteSchema();

  /* Resolved here because only a Server Component can see `public/`. Passing
     the answer down keeps the hero and the header from each asking for an
     image that this deployment does not have. */
  const portraitSrc = portraitAssetExists() ? site.portrait.src : null;

  /* The admin `resume_url` setting wins; otherwise the committed one-page PDF
     is linked directly. `null` is the only state that degrades to mailto. */
  const resumeHref =
    resumeUrl ?? (resumeAssetExists() ? "/resume.pdf" : null);

  return (
    <>
      <script
        type="application/ld+json"
        // Structured data is generated from our own data, not user input.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([personSchema, siteSchema]),
        }}
      />

      <FloatingNav portraitSrc={portraitSrc} />

      <main id="main">
        <Hero />
        <AboutSection resumeUrl={resumeHref} />
        <JourneySection experiences={experiences} educations={educations} />
        <WorkSection projects={projects} />
        <StackSection skills={skills} />
        <LabSection />
        <CurrentlyExploringSection />
        <ServicesSection services={services} />
        <ArchiveSection projects={projects} />
        <NotesSection posts={posts} />
        <UsesSection items={usesItems} />
        <ContactSection />
        <ResumeSection resumeUrl={resumeHref} />
      </main>

      <Footer />

      {/* Screen-reader summary: a compact version of the page for anyone
          who would rather not traverse the visual layout. */}
      <p className="sr-only">
        Portfolio of {site.name}, {site.roleLine} Based in {site.location},
        studying at {site.university}. Sections on this page: about, journey,
        selected work, capabilities, lab, now, how I build, more builds,
        notes, uses, contact, and resume.
      </p>
    </>
  );
}
