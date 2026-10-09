"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, CornerDownLeft, Search } from "lucide-react";
import { navItems, site } from "@/lib/site";
import { useTheme, type ThemePreference } from "./theme-provider";
import {
  motionReduced,
  setMotionPreference,
  useMotionPreference,
  type MotionPreference,
} from "@/components/animations/motion-primitives";
import { cn } from "@/lib/utils";

/* ==========================================================================
   Command palette — Ctrl/Cmd+K quick navigation.

   Root navigation only: every destination is a real anchor, action or
   external link that already exists on this site. Sections are filtered
   against the page before they are offered, so nothing in here dead-ends.

   Opened from the keyboard anywhere, or from the ⌘K trigger in the nav
   (which dispatches a custom event so the palette stays decoupled).
   ========================================================================== */

type Command = {
  id: string;
  label: string;
  hint: string;
  keywords: string;
  run: () => void;
};

const nextTheme: Record<ThemePreference, ThemePreference> = {
  light: "dark",
  dark: "system",
  system: "light",
};

/** Motion control cycles auto → on → off, exactly like the theme button. */
const nextMotion: Record<MotionPreference, MotionPreference> = {
  auto: "on",
  on: "off",
  off: "auto",
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const { preference, setPreference } = useTheme();
  const motion = useMotionPreference();

  const openPalette = useCallback(() => {
    setQuery("");
    setSelected(0);
    setOpen(true);
  }, []);

  /* ---- open/close triggers: ⌘K/Ctrl+K anywhere, custom event from nav ---- */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((v) => (v ? false : true));
        if (!open) {
          setQuery("");
          setSelected(0);
        }
      }
      if (event.key === "Escape") setOpen(false);
    };
    const onOpen = () => openPalette();
    window.addEventListener("keydown", onKey);
    window.addEventListener("command-palette:open", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("command-palette:open", onOpen);
    };
  }, [open, openPalette]);

  /* ---- scroll lock + autofocus while open ---- */
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  /* ---- commands, filtered to sections that exist on this page ---- */
  const baseCommands = useMemo<Command[]>(() => {
    const sections =
      typeof document === "undefined"
        ? []
        : navItems
            .filter((item) => document.getElementById(item.id))
            .map(
        (item): Command => ({
          id: `go-${item.id}`,
          label: item.label,
          hint: `Section · ${item.id}`,
          keywords: `${item.label} ${item.id} section top`,
          run: () => {
            document
              .getElementById(item.id)
              ?.scrollIntoView({
                behavior: motionReduced() ? "auto" : "smooth",
              });
            setOpen(false);
          },
        }),
      );

    return [
      ...sections,
      {
        id: "theme",
        label: "Toggle theme",
        hint: nextTheme[preference] === "dark" ? "Go dark" : "Next theme",
        keywords: "theme dark light mode colour color system",
        run: () => setPreference(nextTheme[preference]),
      },
      {
        id: "motion-cycle",
        label: "Toggle motion",
        hint: `Motion: ${motion.preference} → ${nextMotion[motion.preference]}`,
        keywords:
          "motion animation animate effects reduced reduce play pause auto",
        run: () => setMotionPreference(nextMotion[motion.preference]),
      },
      {
        id: "github",
        label: "GitHub",
        hint: "fahimkazi-eng",
        keywords: "github code repositories source",
        run: () => window.open("https://github.com/fahimkazi-eng", "_blank"),
      },
      {
        id: "linkedin",
        label: "LinkedIn",
        hint: "kazi-fahim-eng621",
        keywords: "linkedin profile professional",
        run: () =>
          window.open(
            "https://www.linkedin.com/in/kazi-fahim-eng621",
            "_blank",
          ),
      },
      {
        id: "email",
        label: "Email me",
        hint: site.email,
        keywords: "email contact message hello",
        run: () => {
          window.location.href = `mailto:${site.email}`;
          setOpen(false);
        },
      },
    ];
  }, [preference, setPreference, motion.preference]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return baseCommands;
    return baseCommands.filter(
      (command) =>
        command.label.toLowerCase().includes(q) ||
        command.keywords.toLowerCase().includes(q),
    );
  }, [baseCommands, query]);

  /* ---- keep selection in bounds; scroll into view ---- */
  const activeIndex = Math.min(selected, Math.max(filtered.length - 1, 0));

  useEffect(() => {
    const list = listRef.current;
    const el = list?.querySelector<HTMLElement>(
      `[data-index="${activeIndex}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelected((i) => (i + 1) % Math.max(filtered.length, 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelected(
        (i) => (i - 1 + Math.max(filtered.length, 1)) % Math.max(filtered.length, 1),
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      filtered[activeIndex]?.run();
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      className="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[18vh]"
    >
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-ink-950/65 backdrop-blur-sm [animation:data-fade_0.2s_ease_both]"
      />

      <div className="relative w-full max-w-xl overflow-hidden rounded-card border border-line-strong bg-canvas shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)] [animation:rule-in_0.28s_cubic-bezier(0.16,1,0.3,1)_both]">
        <div className="flex items-center gap-3 border-b border-line px-5">
          <Search className="size-4 shrink-0 text-fg-subtle" strokeWidth={2} />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelected(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Jump to a section, action or link…"
            aria-label="Search commands"
            className="h-14 min-w-0 flex-1 bg-transparent text-[0.9375rem] text-fg outline-none placeholder:text-fg-subtle"
          />
          <kbd className="type-mono rounded-md border border-line-strong px-1.5 py-0.5 text-fg-subtle">
            esc
          </kbd>
        </div>

        <ul
          ref={listRef}
          role="listbox"
          aria-label="Commands"
          className="max-h-[min(52vh,26rem)] overflow-y-auto p-2"
        >
          {filtered.length === 0 ? (
            <li className="px-4 py-10 text-center">
              <p className="text-body text-fg-muted">
                Nothing matches “{query}”.
              </p>
              <p className="type-mono mt-1.5 text-fg-subtle">
                Try a section name, “theme”, or “github”.
              </p>
            </li>
          ) : (
            filtered.map((command, i) => (
              <li key={command.id} data-index={i}>
                <button
                  type="button"
                  role="option"
                  aria-selected={i === activeIndex}
                  onMouseEnter={() => setSelected(i)}
                  onClick={() => {
                    command.run();
                    if (
                      command.id !== "theme" &&
                      command.id !== "motion-cycle"
                    )
                      setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-4 rounded-lg px-4 py-3 text-left transition-colors duration-150",
                    i === activeIndex
                      ? "bg-fg/[0.07] text-fg"
                      : "text-fg-muted hover:bg-fg/[0.04]",
                  )}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="truncate text-[0.9375rem] font-medium tracking-[-0.01em]">
                      {command.label}
                    </span>
                    <span className="type-mono truncate text-[0.6875rem] text-fg-subtle">
                      {command.hint}
                    </span>
                  </span>
                  {i === activeIndex ? (
                    <CornerDownLeft
                      className="size-3.5 shrink-0 text-accent"
                      strokeWidth={2}
                    />
                  ) : (
                    <ArrowUpRight
                      className={cn(
                        "size-3.5 shrink-0 text-fg-subtle",
                        command.id === "github" ||
                          command.id === "linkedin"
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                      strokeWidth={2}
                    />
                  )}
                </button>
              </li>
            ))
          )}
        </ul>

        <div className="flex items-center gap-4 border-t border-line px-5 py-2.5">
          <p className="type-mono text-[0.6875rem] text-fg-subtle">
            ↑↓ navigate · ↵ run
          </p>
          <p className="type-mono ml-auto text-[0.6875rem] text-fg-subtle">
            {site.name} — {site.role}
          </p>
        </div>
      </div>
    </div>
  );
}