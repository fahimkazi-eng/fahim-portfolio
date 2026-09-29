"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, Moon, Sun, X, Monitor } from "lucide-react";
import { navItems, site } from "@/lib/site";
import { cn } from "@/lib/utils";
import { useTheme, type ThemePreference } from "./theme-provider";
import { Magnetic } from "./magnetic";

/* ==========================================================================
   FloatingNav

   - Fixed, glass, and it transforms on scroll: wide pill at the top,
     compact bar once the hero is behind you.
   - Active section tracked with an IntersectionObserver, not a scroll
     listener, so it costs nothing while idle.
   - The active pill is a single shared element translated on x/width, so
     only one transform is animating at a time.
   - Mobile: full-screen sheet with staggered links, focus trapped by the
     dialog primitive underneath.
   ========================================================================== */

export function FloatingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [activeId, setActiveId] = useState<string>("about");
  const [open, setOpen] = useState(false);
  const { preference, resolved, setPreference } = useTheme();

  const pillRef = useRef<HTMLSpanElement | null>(null);
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

  /* ---- scroll state (passive, rAF-throttled) ---- */
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 40);
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ---- active section ---- */
  useEffect(() => {
    const sections = navItems
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      {
        rootMargin: "-45% 0px -50% 0px",
        threshold: [0, 0.25, 0.5, 1],
      },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  /* ---- move the active pill to the right link ---- */
  useEffect(() => {
    const pill = pillRef.current;
    const link = linkRefs.current[activeId];
    if (!pill || !link) return;

    const { offsetLeft, offsetWidth } = link;
    pill.style.setProperty("--pill-x", `${offsetLeft}px`);
    pill.style.setProperty("--pill-w", `${offsetWidth}px`);
  }, [activeId, scrolled]);

  /* ---- lock body scroll while the mobile sheet is open ---- */
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const nextTheme: Record<ThemePreference, ThemePreference> = {
    light: "dark",
    dark: "system",
    system: "light",
  };
  const ThemeIcon =
    preference === "system" ? Monitor : resolved === "dark" ? Moon : Sun;

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 flex justify-center transition-[padding] duration-500 ease-out",
          scrolled ? "pt-3" : "pt-[clamp(0.75rem,0.4rem+1.4vw,1.75rem)]",
        )}
      >
        <nav
          aria-label="Primary"
          className={cn(
            "relative flex items-center gap-1 rounded-pill border border-line transition-all duration-500 ease-out",
            scrolled
              ? "glass h-12 w-[min(100%-1.5rem,64rem)] shadow-[0_10px_40px_-24px_rgba(0,0,0,0.6)] pl-5 pr-1.5"
              : "h-14 w-[min(100%-2.5rem,68rem)] border-transparent bg-transparent pl-1 pr-1",
          )}
        >
          {/* Wordmark */}
          <Link
            href="#hero"
            className="group mr-1 flex items-center gap-2.5 rounded-pill py-1 pr-2"
            aria-label={`${site.name} — back to top`}
          >
            <span
              aria-hidden="true"
              className="grid size-8 place-items-center rounded-full bg-fg text-[0.7rem] font-semibold tracking-tight text-canvas transition-colors duration-300 group-hover:bg-accent group-hover:text-accent-fg"
            >
              {site.initials}
            </span>
            <span className="hidden font-display text-[0.95rem] font-semibold tracking-tight text-fg sm:inline">
              {site.name}
            </span>
          </Link>

          {/* Desktop links */}
          <div className="relative hidden flex-1 items-center justify-center md:flex">
            <span
              ref={pillRef}
              aria-hidden="true"
              className="absolute left-0 top-1/2 h-9 -translate-y-1/2 rounded-pill bg-fg/[0.07] transition-[width,transform] duration-500 ease-out"
              style={{ width: "var(--pill-w, 0px)", transform: "translate(var(--pill-x, 0), -50%)" }}
            />
            <ul className="relative flex items-center gap-1">
              {navItems.map((item) => (
                <li key={item.id}>
                  <a
                    ref={(el) => {
                      linkRefs.current[item.id] = el;
                    }}
                    href={`#${item.id}`}
                    aria-current={activeId === item.id ? "true" : undefined}
                    className={cn(
                      "relative flex h-9 items-center gap-1.5 rounded-pill px-3.5 text-[0.8125rem] transition-colors duration-300",
                      activeId === item.id ? "text-fg" : "text-fg-muted hover:text-fg",
                    )}
                  >
                    <span className="type-mono text-[0.55rem] text-accent/80 tabular-nums">
                      {item.index}
                    </span>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Right cluster */}
          <div className="ml-auto flex items-center gap-1.5">
            <Magnetic strength={5}>
              <button
                type="button"
                onClick={() => setPreference(nextTheme[preference])}
                aria-label={`Theme: ${preference}. Switch to ${nextTheme[preference]}.`}
                className="grid size-9 place-items-center rounded-full text-fg-muted transition-colors duration-300 hover:bg-fg/[0.06] hover:text-fg"
              >
                <ThemeIcon className="size-[1.05rem]" strokeWidth={1.75} />
              </button>
            </Magnetic>

            <Magnetic strength={5}>
              <a
                href={`#${navItems.at(-1)?.id ?? "contact"}`}
                className="hidden h-9 items-center rounded-full bg-fg px-4 text-[0.8125rem] font-medium text-canvas transition-colors duration-300 hover:bg-accent hover:text-accent-fg sm:inline-flex"
              >
                Let&apos;s talk
              </a>
            </Magnetic>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
              className="grid size-9 place-items-center rounded-full text-fg transition-colors duration-300 hover:bg-fg/[0.06] md:hidden"
            >
              {open ? (
                <X className="size-[1.15rem]" strokeWidth={1.75} />
              ) : (
                <Menu className="size-[1.15rem]" strokeWidth={1.75} />
              )}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile sheet */}
      <div
        id="mobile-nav"
        hidden={!open}
        className="fixed inset-0 z-40 md:hidden"
      >
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          onClick={() => setOpen(false)}
          className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm"
        />
        <div className="absolute inset-x-0 top-0 glass rounded-b-[2rem] px-[clamp(1.15rem,0.6rem+2.6vw,4.5rem)] pb-10 pt-24">
          <ul className="space-y-1">
            {navItems.map((item, i) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={() => setOpen(false)}
                  style={{ animationDelay: `${i * 45}ms` }}
                  className="flex items-baseline gap-4 border-b border-line py-3.5 font-display text-[1.75rem] font-semibold tracking-tight text-fg [animation:rule-in_0.5s_cubic-bezier(0.16,1,0.3,1)_both]"
                >
                  <span className="type-mono text-accent tabular-nums">
                    {item.index}
                  </span>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <p className="type-mono mt-8 text-fg-subtle">
            {site.location} · {site.role}
          </p>
        </div>
      </div>
    </>
  );
}
