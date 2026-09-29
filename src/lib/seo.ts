import "server-only";
import type {
  Education,
  Experience,
  Project,
} from "@/lib/db/schema";
import { site, siteOrigin } from "./site";

/**
 * Structured data. Everything here is derived from the database or the
 * identity config — no values are hard-coded that could drift from the
 * visible page.
 */

const PERSON_TYPE = "Person";

export function buildPersonSchema({
  projects,
  experiences,
  educations,
}: {
  projects: Project[];
  experiences: Experience[];
  educations: Education[];
}) {
  const alumniOf = educations
    .filter((e) => !e.current)
    .map((e) => ({ "@type": "EducationalOrganization", name: e.institution }));

  const attendedTo = educations.map((e) => ({
    "@type": "EducationalOrganization",
    name: e.institution,
  }));

  return {
    "@context": "https://schema.org",
    "@type": PERSON_TYPE,
    name: site.name,
    alternateName: site.name,
    jobTitle: "Software Developer",
    description: site.seo.description,
    email: `mailto:${site.email}`,
    address: {
      "@type": "PostalAddress",
      addressCountry: "BD",
    },
    knowsLanguage: [...site.languages],
    alumniOf,
    attendedTo,
    worksFor: experiences.map((e) => ({
      "@type": "Organization",
      name: e.organization,
    })),
    hasOccupation: {
      "@type": "Occupation",
      name: "Software Developer",
      occupationLocation: { "@type": "Country", name: "Bangladesh" },
      skills: [
        "Project Management",
        "Public Relations",
        "Teamwork",
        "Time Management",
        "Leadership",
        "Effective Communication",
        "Critical Thinking",
      ],
    },
    knowsAbout: [
      "Computer Science",
      "Web Development",
      "Database Design",
      "User Interface Engineering",
      ...projects.flatMap((p) => p.tech),
    ],
  };
}

export function buildWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: `${site.name} — Portfolio`,
    url: siteOrigin(),
    inLanguage: "en",
    description: site.seo.description,
  };
}

export function buildProjectSchema(project: Project) {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.summary ?? project.tagline ?? project.title,
    url: project.liveUrl ?? undefined,
    author: { "@type": PERSON_TYPE, name: site.name },
    keywords: project.tech.join(", ") || undefined,
    dateCreated: project.year || undefined,
  };
}

export function buildBreadcrumbs(items: { name: string; href: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.href,
    })),
  };
}
