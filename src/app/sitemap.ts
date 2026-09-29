import type { MetadataRoute } from "next";
import { getPublishedProjects } from "@/lib/db/queries";
import { siteOrigin } from "@/lib/site";

/**
 * Public routes only. /admin is excluded here and in robots.ts.
 *
 * `getPublishedProjects` is wrapped in a catch: a sitemap that throws while
 * the database is briefly unreachable should still return the homepage rather
 * than a 500, and a missing project should not take the whole map down.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteOrigin();
  const projects = await getPublishedProjects().catch(() => []);

  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...projects.map((project) => ({
      url: `${base}/work/${project.slug}`,
      lastModified: project.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
