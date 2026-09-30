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
      /*
        Recordings are multi-megabyte and their filenames are stable
        (`/projects/<slug>-demo.mp4`). Served with the default `max-age=0`
        they are revalidated on every single visit, which for a video means a
        pointless conditional request for megabytes the visitor already has.

        A year, immutable. The trade is explicit: replacing a recording means
        renaming the file (or changing its path in the admin), otherwise
        returning visitors keep the old clip. That is the same rule GitHub and
        every CDN apply to fingerprinted assets, and it is the only safe way to
        get a long TTL on user-supplied media.

        Range requests are unaffected — the `Accept-Ranges` header still comes
        from the file server, so seeking works exactly as before.
      */
      {
        source: "/projects/:file*.mp4",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/projects/:file*.webm",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      /*
        Poster frames are extracted from those recordings, so they change
        whenever the recording does and are served under the same rule.
      */
      {
        source: "/projects/:file*-poster.jpg",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
