import "server-only";

import { existsSync } from "node:fs";
import path from "node:path";
import { site } from "@/lib/site";

/* ==========================================================================
   Portrait asset resolution.

   `public/portrait.jpg` is a deployment artefact, not source: the owner drops
   it in whenever the photograph is ready. Nothing in the repo needs to change
   when that happens, and nothing should break while it has not.

   The naive arrangement — always render a `<Image>` and hide it on error —
   costs two failed optimiser requests on every single page load of every
   route, forever, and fills the console with 400s. That is a permanent tax
   paid for a file that is expected to be absent most of the time.

   So the check happens here, on the server, where the filesystem is visible
   and the request costs one `stat`. A missing file means `Portrait` is never
   given a `src`, renders its monogram layer alone, and the network is never
   asked about it at all. The moment the file appears — at build time locally,
   or on redeploy in production — the photograph renders, with no flag to flip
   and no import to add (an import of a missing file would fail the build).

   Runs at render time, which for this site is build time plus ISR. On Vercel
   that means the answer is decided by what is in the deployment, which is
   exactly the question being asked.
   ========================================================================== */

/**
 * Whether the configured portrait is actually present in `public/`.
 *
 * Only same-origin public paths are probed. A remote or data URL is reported
 * as present: it is not ours to check, and assuming it is missing would
 * silently suppress a legitimately configured image.
 */
export function portraitAssetExists(src: string = site.portrait.src): boolean {
  if (!src.startsWith("/")) return true;

  let decoded = src;
  try {
    decoded = decodeURIComponent(src);
  } catch {
    // A malformed escape sequence is not a path we can resolve.
    return false;
  }

  const root = path.resolve(process.cwd(), "public");
  const resolved = path.resolve(root, `.${decoded}`);

  // Refuse anything that escapes `public/` — the value is configuration, but
  // it should still not be able to probe the rest of the deployment.
  if (resolved !== root && !resolved.startsWith(root + path.sep)) return false;

  return existsSync(resolved);
}