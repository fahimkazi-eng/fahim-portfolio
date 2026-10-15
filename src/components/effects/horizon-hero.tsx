"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { usePrefersReducedMotion } from "@/components/animations/motion-primitives";
import { HORIZON_PANELS } from "@/lib/horizon";

/* Three.js is a browser-only, ~600 KB dependency. It is code-split here and
   never reaches the server bundle, matching the AuroraField/ShaderCanvas
   pattern in hero.tsx and lab.tsx — `ssr: false` is only valid inside a
   Client Component, which is why this wrapper exists. */
const HorizonHeroSection = dynamic(
  () => import("@/components/ui/horizon-hero-section"),
  { ssr: false, loading: () => <HorizonStatic /> },
);

/* Same radial field the live scene sits on, minus the WebGL. Under reduced
   motion the module above is never even downloaded. */
const BACKDROP =
  "bg-[radial-gradient(120%_80%_at_50%_115%,rgba(0,51,255,0.28),transparent_62%),radial-gradient(90%_60%_at_50%_-10%,rgba(255,0,102,0.14),transparent_70%)]";

export function HorizonExperience() {
  const reduced = usePrefersReducedMotion();

  return (
    <>
      <Link
        href="/"
        className="type-mono fixed top-8 right-6 z-20 inline-flex items-center gap-2 rounded-pill border border-line bg-surface/60 px-3.5 py-2 text-fg-muted backdrop-blur-sm transition-colors duration-300 hover:border-accent/50 hover:text-fg sm:right-10"
      >
        <ArrowLeft aria-hidden="true" className="size-3.5" />
        Back to portfolio
      </Link>

      {reduced ? (
        <HorizonStatic hint="Static scene — motion is reduced" />
      ) : (
        <HorizonHeroSection />
      )}
    </>
  );
}

/** The static scene: same composition, no canvas. Used both while the WebGL
    chunk loads and as the permanent state under reduced motion; `hint` only
    renders in the latter case, so a motion-enabled visitor never sees a
    "motion is reduced" claim. */
function HorizonStatic({ hint }: { hint?: string }) {
  const first = HORIZON_PANELS[0];

  return (
    <>
      <div
        aria-hidden="true"
        className={`pointer-events-none fixed inset-0 z-0 bg-canvas ${BACKDROP}`}
      />
      <section className="relative z-10 flex h-svh flex-col items-center justify-center px-6 text-center">
        <h1 className="font-display text-[clamp(2.75rem,13vw,10rem)] leading-[0.92] font-bold tracking-tight uppercase">
          {first.title}
        </h1>
        <div className="mt-6 max-w-[46ch] text-lead text-fg-muted">
          <p>{first.line1}</p>
          <p>{first.line2}</p>
        </div>
        {hint ? (
          <p className="type-mono mt-10 text-fg-subtle">{hint}</p>
        ) : null}
      </section>
    </>
  );
}
