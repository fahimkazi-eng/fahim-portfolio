"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { site } from "@/lib/site";

/* ==========================================================================
   Portrait

   The owner's photograph, in a frame that is designed whether or not the
   photograph exists.

   The component renders TWO layers:

     1. a monogram tile — always present, in the same box, same radius
     2. the photograph — faded in on top, invisible until it has decoded

   That ordering is the whole point. With a plain <Image> a missing file
   surfaces as a broken-image glyph over an empty hole. Here a photo that
   never arrives simply leaves the monogram showing, which reads as a
   deliberate object rather than a fault, and the box never changes size.

   The photo layer is only mounted when there IS a photo to mount. `src` is
   `null` when the server has already established that `public/portrait.jpg`
   is absent — see `SitePortrait`. That is the normal state today, and it
   costs zero network requests. The `onError` path below is now a backstop
   for a file that is present but unreadable, not the expected path.

   Dropping the real file into `public/` is the entire activation step. There
   is no flag to flip and no import to add (an import of a missing file would
   fail the build; a path cannot).

   This is the only piece of client state in the component and it flips at
   most twice, on load and on error. Nothing here animates per frame.
   ========================================================================== */

export type PortraitProps = {
  /**
   * `null` means "there is no photograph in this deployment" and renders the
   * monogram alone, with no request issued. Omit it to use the configured
   * site portrait; prefer `SitePortrait`, which resolves this server-side.
   */
  src?: string | null;
  /**
   * Pass "" when the name is rendered as adjacent text (the header
   * wordmark). An image alt that repeats the visible label makes a screen
   * reader announce the name twice, and on mobile — where the visible name
   * is hidden — it would be the only name present.
   */
  alt?: string;
  /** Intrinsic pixel size for the optimiser. */
  size?: number;
  sizes?: string;
  priority?: boolean;
  className?: string;
  /** Initials used by the fallback layer. */
  initials?: string;
};

export function Portrait({
  src = site.portrait.src,
  alt = site.portrait.alt,
  size = 640,
  sizes = "(max-width: 640px) 40vw, 22rem",
  priority = false,
  className,
  initials = site.initials,
}: PortraitProps) {
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");
  const hasPhoto = Boolean(src) && state !== "failed";

  return (
    <span
      className={cn(
        "relative block overflow-hidden rounded-full bg-surface-strong",
        "ring-1 ring-line-strong",
        "portrait-frame",
        className,
      )}
    >
      {/* Layer 1 — monogram. Never unmounts, so it is what you see before
          the photo decodes, if it never decodes, and if JS is slow. */}
      <span
        aria-hidden="true"
        className="absolute inset-0 grid place-items-center bg-[linear-gradient(150deg,color-mix(in_oklab,var(--accent)_26%,var(--surface-strong)),var(--surface-strong)_62%)]"
      >
        <span className="type-display text-[0.34em] font-semibold tracking-[-0.04em] text-fg/85 [font-size:min(2.6rem,9cqw)]">
          {initials}
        </span>
        {/* Hairline sheen, so the fallback reads as a designed object. */}
        <span className="absolute inset-0 rounded-full bg-[linear-gradient(115deg,transparent_38%,color-mix(in_oklab,var(--fg)_9%,transparent)_50%,transparent_62%)]" />
      </span>

      {/* Layer 2 — the photograph. Not mounted at all when the server knows
          there is no photograph, which is the common case. */}
      {hasPhoto ? (
        <Image
          src={src as string}
          alt={alt}
          width={size}
          height={size}
          sizes={sizes}
          priority={priority}
          loading={priority ? undefined : "lazy"}
          onLoad={() => setState("ready")}
          onError={() => setState("failed")}
          className={cn(
            "relative h-full w-full object-cover",
            // The source is 1108x1373, so a circle crops ~130px off each edge.
            // Biasing above centre keeps a headshot's hairline intact; this is
            // the one line to change if the photograph is composed differently.
            "object-[center_38%]",
            // Opacity only, and only on the first decode. A transform
            // transition here would compete with the hero timeline.
            "transition-opacity duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
            state === "ready" ? "opacity-100" : "opacity-0",
          )}
        />
      ) : null}
    </span>
  );
}
