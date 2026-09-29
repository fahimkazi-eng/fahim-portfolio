import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const base = siteOrigin();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // The dashboard is behind authentication; there is nothing here for a
        // crawler and no reason to let one index the login screen.
        disallow: ["/admin", "/admin/", "/api/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
