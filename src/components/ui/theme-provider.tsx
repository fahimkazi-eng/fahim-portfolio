"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

/* ==========================================================================
   Theme — class-based on <html>, resolved before paint by the inline script
   in layout.tsx, so there is never a flash of the wrong theme.

   The preference lives in localStorage and "system" also depends on the OS
   media query. Both are external to React, so they are read through
   `useSyncExternalStore` with a server snapshot: hydration renders the
   server's answer first and the real one immediately after, instead of the
   effect-then-setState pattern that causes a cascading render.
   ========================================================================== */

export type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "kf-theme";

function isPreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isPreference(stored) ? stored : "dark";
  } catch {
    // Private mode, or storage blocked. Dark is the identity default.
    return "dark";
  }
}

function prefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolve(pref: ThemePreference): "light" | "dark" {
  const dark = pref === "dark" || (pref === "system" && prefersDark());
  return dark ? "dark" : "light";
}

/**
 * Runs before hydration. Kept as a string in the document head so it is the
 * first thing that executes, ahead of any stylesheet application. This is
 * also what makes the resolved theme correct on first paint — React's own
 * store is only the source of truth for what the toggle button renders.
 */
export const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem('${STORAGE_KEY}');
    var pref = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'dark';
    var dark = pref === 'dark' || (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    var root = document.documentElement;
    root.classList.toggle('dark', dark);
    root.style.colorScheme = dark ? 'dark' : 'light';
  } catch (e) {}
})();
`;

/** Writes the resolved theme to <html>. The only DOM side effect. */
function applyToRoot(pref: ThemePreference): "light" | "dark" {
  const value = resolve(pref);
  const dark = value === "dark";
  const root = document.documentElement;
  root.classList.toggle("dark", dark);
  root.style.colorScheme = value;
  return value;
}

/**
 * Store shape: `{ preference, resolved }`. Kept as one object so a single
 * snapshot serves both subscribers and they can never disagree with
 * each other for a frame.
 */
type Snapshot = { preference: ThemePreference; resolved: "light" | "dark" };

const SERVER_SNAPSHOT: Snapshot = { preference: "dark", resolved: "dark" };

let cached: Snapshot | null = null;
const listeners = new Set<() => void>();

function emit() {
  cached = null;
  for (const listener of listeners) listener();
}

function getSnapshot(): Snapshot {
  if (!cached) {
    const preference = readPreference();
    cached = { preference, resolved: resolve(preference) };
  }
  return cached;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  // Only wire the media listener once, however many components subscribe.
  if (listeners.size === 1) {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", onExternalChange);
    window.addEventListener("storage", onExternalChange);
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      media.removeEventListener("change", onExternalChange);
      window.removeEventListener("storage", onExternalChange);
    }
  };
}

/** Fires when the OS theme flips or another tab writes the preference. */
function onExternalChange() {
  const preference = readPreference();
  applyToRoot(preference);
  emit();
}

const ThemeContext = createContext<{
  preference: ThemePreference;
  resolved: "light" | "dark";
  setPreference: (value: ThemePreference) => void;
  toggle: () => void;
} | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAPSHOT);
  const { preference, resolved } = snapshot;

  const setPreference = useCallback(
    (value: ThemePreference) => {
      try {
        localStorage.setItem(STORAGE_KEY, value);
      } catch {
        // Private mode: the theme still applies for this session.
      }
      applyToRoot(value);
      emit();
    },
    [],
  );

  const toggle = useCallback(() => {
    const next: ThemePreference = resolve(readPreference()) === "dark" ? "light" : "dark";
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* see above */
    }
    applyToRoot(next);
    emit();
  }, []);

  /* Keep <html> in step with the store. The inline script already did this
     pre-hydration; this keeps it correct if anything ever changes the store
     from outside React's tree. */
  useEffect(() => {
    applyToRoot(preference);
  }, [preference]);

  const value = useMemo(
    () => ({ preference, resolved, setPreference, toggle }),
    [preference, resolved, setPreference, toggle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used inside <ThemeProvider>");
  }
  return ctx;
}
