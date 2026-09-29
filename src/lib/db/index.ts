import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * Neon HTTP driver: single fetch per query over HTTP, no persistent socket.
 * This works in every Next.js runtime (Node serverless functions, edge, or a
 * long-lived Node server) without pooling configuration.
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
