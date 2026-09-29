import { FloatingNav } from "@/components/ui/nav";
import { Hero } from "@/components/sections/hero";
import { AboutSection } from "@/components/sections/about";
import { StackSection } from "@/components/sections/stack";
import { WorkSection } from "@/components/sections/work";
import { StorySection } from "@/components/sections/story";
import { PathSection } from "@/components/sections/path";
import { ServicesSection } from "@/components/sections/services";
import { ContactSection } from "@/components/sections/contact";
import { Footer } from "@/components/sections/footer";
import {
  getEducations,
  getExperiences,
  getPublishedProjects,
  getServices,
  getSkills,
} from "@/lib/db/queries";
import { site } from "@/lib/site";
import { buildPersonSchema, buildWebSiteSchema } from "@/lib/seo";

/* --------------------------------------------------------------------------
   One request, one round of parallel queries, one render. Every section
   below is a Server Component; the only client boundaries are the ones
   inside them (nav, hero canvas, cursor, form, motion primitives).
   -------------------------------------------------------------------------- */

export const revalidate = 60;

export default async function HomePage() {
  const [projects, skills, experiences, educations, services] =
    await Promise.all([
      getPublishedProjects(),
      getSkills(),
      getExperiences(),
      getEducations(),
      getServices(),
    ]);

  const personSchema = buildPersonSchema({
    projects,
    experiences,
    educations,
  });
  const siteSchema = buildWebSiteSchema();

  return (
    <>
      <script
        type="application/ld+json"
        // Structured data is generated from our own data, not user input.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([personSchema, siteSchema]),
        }}
      />

      <FloatingNav />

      <main id="main">
        <Hero />
        <AboutSection />
        <StackSection skills={skills} />
        <WorkSection projects={projects} />
        <StorySection projects={projects} />
        <PathSection experiences={experiences} educations={educations} />
        <ServicesSection services={services} />
        <ContactSection />
      </main>

      <Footer />

      {/* Screen-reader summary: a compact version of the page for anyone
          who would rather not traverse the visual layout. */}
      <p className="sr-only">
        Portfolio of {site.name}, {site.roleLine} Based in {site.location},
        studying at {site.university}. Sections on this page: about,
        capabilities, selected work, case studies, experience and education,
        services, and contact.
      </p>
    </>
  );
}
