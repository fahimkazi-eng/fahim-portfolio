/**
 * Clears Next's persisted data cache before a build. Wired as `prebuild`.
 *
 * Next.js keeps a data cache in `.next/cache` that survives between local
 * builds. The Neon HTTP driver issues its SQL through the global `fetch`,
 * which Next patches, so those queries are cached — keyed on the request, and
 * the request is a POST whose body is the query text. Two queries that differ
 * only by a `LIMIT` therefore get separate keys and separate entries.
 *
 * The consequence was a build that trusted the database instead of a day-old
 * cached response: `getProjectBySlug` and `getProjectById` (both `limit 1`)
 * returned stale rows, so prerendered case studies showed the placeholder
 * instead of a project's screenshot, and the admin edit form opened a project
 * as it existed before the previous save.
 *
 * Only the data cache is removed. The image optimisation cache is left alone,
 * since it is keyed on content and rebuilding it is pure wasted work.
 *
 * A hosted deploy builds from a clean checkout with no `.next` directory, so it
 * never sees these entries; this matters for local builds, where the directory
 * survives. It is a floor, not the whole guarantee — correctness of the
 * prerendered output still comes from `revalidatePath` after an admin write.
 */
import { rm } from "node:fs/promises";
import path from "node:path";

const target = path.join(process.cwd(), ".next", "cache", "fetch-cache");

try {
  await rm(target, { recursive: true, force: true });
  console.log("[prebuild] cleared stale data cache");
} catch (error) {
  // A missing directory is the normal case on a first build, and failing the
  // build over it would be worse than proceeding.
  console.log(`[prebuild] nothing to clear (${error.code ?? "unknown"})`);
}
