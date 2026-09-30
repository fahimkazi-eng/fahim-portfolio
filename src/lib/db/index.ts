import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * Neon HTTP driver: single fetch per query over HTTP, no persistent socket.
 * This works in every Next.js runtime (Node serverless functions, edge, or a
 * long-lived Node server) without pooling configuration.
 *
 * Do NOT pass `fetchOptions: { cache: "no-store" }` here, even though every
 * instinct says a database read should be uncacheable. It opts the calling
 * route into dynamic rendering, which would cost this site its static
 * prerender of `/` and every case study. Caching is handled one layer up, where
 * it is visible and controllable: `revalidate` on the routes, and
 * `revalidatePath` in the server actions after a write.
 *
 * What that leaves is Next's data cache, which persists in `.next/cache`
 * between local builds. The driver sends its SQL as a POST whose body is the
 * query text, so two queries differing only by a `LIMIT` get distinct cache
 * keys — and a `limit 1` entry written by an older build was replayed as the
 * current answer, making `getProjectBySlug` and `getProjectById` return rows
 * up to a day stale while `getPublishedProjects` returned current data. Builds
 * baked those rows into the case studies, and the admin edit form loaded a
 * project as it was before the last save, so saving could silently overwrite
 * newer content. `prebuild` clears that cache so a build only ever reads the
 * live database. See `scripts/clean-data-cache.mjs`.
 */
function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and add your Neon connection string.",
    );
  }
  return neon(url);
}

const client = createClient();

export const db = drizzle(client, { schema });
export { schema };
