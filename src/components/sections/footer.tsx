import { footerLinks, navItems, site } from "@/lib/site";
import { Marquee } from "@/components/ui/marquee";
import { SplitText } from "@/components/animations/split-text";
import { Magnetic } from "@/components/ui/magnetic";

/* ==========================================================================
   Footer — deliberately not a separate "template block": it continues the
   contact section's composition, closing on the same oversized type.
   ========================================================================== */

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-line">
      <div className="gutter shell">
        {/* Oversized closing statement */}
        <div className="py-[clamp(3rem,8vw,7rem)]">
          <p className="type-mono mb-6 text-fg-subtle">
            That&apos;s the work. Let&apos;s talk about yours.
          </p>
          <a
            href="#contact"
            className="group block"
            aria-label="Jump back to the contact form"
          >
            <span className="type-display block text-h1 leading-[0.85] text-fg transition-colors duration-500 group-hover:text-accent">
              <SplitText text="Get in touch" duration={1.1} />
            </span>
          </a>
        </div>

        {/* Link columns */}
        <div className="rule grid grid-cols-2 gap-8 py-10 md:grid-cols-4">
          <div>
            <p className="type-mono mb-4 text-fg-subtle">Index</p>
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="text-[0.875rem] text-fg-muted transition-colors duration-300 hover:text-accent"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="type-mono mb-4 text-fg-subtle">Contact</p>
            <ul className="space-y-2">
              <li>
                <a
                  href={`mailto:${site.email}`}
                  className="break-all text-[0.875rem] text-fg-muted transition-colors duration-300 hover:text-accent"
                >
                  {site.email}
                </a>
              </li>
              <li className="text-[0.875rem] text-fg-subtle">{site.location}</li>
              <li className="text-[0.875rem] text-fg-subtle">
                {site.university}
              </li>
            </ul>
          </div>

          <div>
            <p className="type-mono mb-4 text-fg-subtle">Elsewhere</p>
            {/* Social links are data in `site.ts` (footerLinks) — add or replace
                a profile URL there and every page reflects it. */}
            <ul className="space-y-2">
              {footerLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target={link.external ? "_blank" : undefined}
                    rel={link.external ? "noopener noreferrer me" : undefined}
                    className="text-[0.875rem] text-fg-muted transition-colors duration-300 hover:text-accent"
                  >
                    {link.label}
                    {link.external ? " ↗" : ""}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="type-mono mb-4 text-fg-subtle">Languages</p>
            <ul className="space-y-2">
              {site.languages.map((lang) => (
                <li key={lang} className="text-[0.875rem] text-fg-muted">
                  {lang}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Colophon */}
        <div className="rule flex flex-col gap-4 py-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="type-mono text-fg-subtle">
            © {year} {site.name}
          </p>
          <p className="type-mono text-fg-subtle">
            Built with Next.js, Postgres &amp; too much coffee
          </p>
          <Magnetic strength={6}>
            <a
              href="#hero"
              className="type-mono inline-flex h-9 items-center gap-2 rounded-pill border border-line-strong px-4 text-fg-muted transition-colors duration-300 hover:border-accent hover:text-accent"
            >
              ↑ Back to top
            </a>
          </Magnetic>
        </div>
      </div>

      {/* Wordmark bleed — the last thing on the page, clipped by the fold. */}
      <div className="relative -mb-[0.14em] w-full select-none overflow-hidden" aria-hidden="true">
        <Marquee speed={70} className="border-0 py-2" separator="">
          <span className="type-display whitespace-nowrap text-[clamp(4rem,17vw,14rem)] leading-[0.8] text-fg/[0.055]">
            {site.name} · {site.name} · {site.name} ·
          </span>
        </Marquee>
      </div>
    </footer>
  );
}
