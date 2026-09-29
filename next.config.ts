import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* v16 requires an explicit quality allowlist for the image optimizer. */
  images: {
    qualities: [65, 75, 80, 90],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24,
    // Local media only. Add remotePatterns here if project screenshots are
    // served from a CDN rather than /public.
    remotePatterns: [],
  },

  experimental: {
    /* motion / gsap / drizzle ship large barrel files; let Turbopack strip
       them to the symbols actually imported. lucide-react is already on the
       default list. */
    optimizePackageImports: ["motion", "motion/react", "gsap", "lenis", "ogl"],
  },

  typedRoutes: true,

  poweredByHeader: false,
  reactStrictMode: true,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
      {
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
