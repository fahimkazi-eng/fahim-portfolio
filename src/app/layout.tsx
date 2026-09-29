import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { site } from "@/lib/site";
import { ThemeProvider, themeInitScript } from "@/components/ui/theme-provider";
import { MotionProvider } from "@/components/animations/motion-primitives";
import { CustomCursor } from "@/components/ui/cursor";
import { ScrollProgress } from "@/components/animations/scroll-motion";

/* --------------------------------------------------------------------------
   Typography = the identity.

   Bricolage Grotesque is a variable font with weight, width and optical-size
   axes. We use its width axis for display settings and let the body stay on
   a quiet grotesque so the contrast is deliberate rather than decorative.
   JetBrains Mono carries every index, label and metadata string.
   -------------------------------------------------------------------------- */

/* Bricolage Grotesque is variable, so no `weight` array — the whole axis
   range comes through, which is the point of choosing it. */
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bricolage",
  axes: ["wdth", "opsz"],
});

const sans = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-sans",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://kazifahim.dev",
  ),
  title: {
    default: site.seo.title,
    template: `%s — ${site.name}`,
  },
  description: site.seo.description,
  keywords: [...site.seo.keywords],
  authors: [{ name: site.name }],
  creator: site.name,
  applicationName: `${site.name} — Portfolio`,
  category: "portfolio",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: `${site.name} — Portfolio`,
    title: site.seo.title,
    description: site.seo.description,
  },
  twitter: {
    card: "summary_large_image",
    title: site.seo.title,
    description: site.seo.description,
  },
  /* No `robots` key on purpose.

     Next injects `<meta name="robots" content="noindex">` when notFound()
     runs, and because a missing case study is served under a 200 status
     (documented streaming behaviour), that meta tag is the only thing keeping
     a non-existent slug out of search results. Declaring `index: true` here
     would win over the injected tag and make every missing slug indexable.

     Omitting it is not a loss: absent an explicit directive, crawlers index
     by default. The per-route `robots: { index: false }` on /admin still
     applies, because that one is set on the nested layout, not here. */
  alternates: { canonical: "/" },
  formatDetection: { email: true, address: false, telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f1ea" },
    { media: "(prefers-color-scheme: dark)", color: "#060607" },
  ],
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      // Lets Next override scroll-behavior on navigation, which Lenis relies on.
      data-scroll-behavior="smooth"
      className={`${display.variable} ${sans.variable} ${mono.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Runs before first paint so the correct theme is applied with no flash. */}
        <script
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
          suppressHydrationWarning
        />
      </head>
      <body className="min-h-svh bg-canvas text-fg">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-pill focus:bg-fg focus:px-5 focus:py-2.5 focus:text-[0.875rem] focus:font-medium focus:text-canvas"
        >
          Skip to content
        </a>

        <ThemeProvider>
          <MotionProvider>
            <ScrollProgress />
            <CustomCursor />
            {children}
          </MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
