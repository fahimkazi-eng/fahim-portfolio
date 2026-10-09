import "server-only";

import { existsSync } from "node:fs";
import path from "node:path";

/* ==========================================================================
   Resume asset resolution.

   `public/resume.pdf` is a deployment artefact, committed once the owner's
   one-page resume exists. It is the fallback for the Resume section: when the
   admin has not set a `resume_url` setting, the committed PDF is linked
   directly instead of the buttons degrading to a mailto request.

   Same reasoning as portrait-asset.ts: the check runs on the server, costs one
   `stat`, and keeps a missing file from producing a broken link anywhere.
   ========================================================================== */

/**
 * Whether `public/resume.pdf` is actually present in the deployment.
 *
 * Only the known public path is probed; the admin setting is trusted as-is
 * elsewhere, because a configured URL is not ours to verify.
 */
export function resumeAssetExists(): boolean {
  const root = path.resolve(process.cwd(), "public");
  const resolved = path.resolve(root, "resume.pdf");

  if (resolved !== root && !resolved.startsWith(root + path.sep)) return false;

  return existsSync(resolved);
}
