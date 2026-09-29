import type { MetadataRoute } from "next";
import { getPublishedProjects } from "@/lib/db/queries";

/** Public routes only. /admin is excluded via robots.ts and its own metadata. */

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "https://kazifahim.dev";

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
