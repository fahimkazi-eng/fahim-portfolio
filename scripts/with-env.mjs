/**
 * Runs a command with `.env.local` / `.env` loaded into `process.env`.
 *
 * `drizzle-kit` is a standalone binary: unlike `next build`, it does not load
 * the app's env files, so `db:migrate` and `db:push` fail with
 * "Please provide required params for Postgres driver: url: ''" unless the
 * caller happens to have DATABASE_URL exported already.
 *
 * This wraps those two scripts so they work from a plain `npm run db:migrate`,
 * with the same precedence Next uses: an already-set variable always wins, so
 * CI and production shells can override the local file.
 *
 *   node scripts/with-env.mjs drizzle-kit migrate
 */

import { readFileSync, existsSync } from "node:fs";
import { spawn } from "node:child_process";

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    if (!existsSync(file)) continue;
    for (const rawLine of readFileSync(file, "utf8").split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      // Never clobber a real environment variable.
      if (!(key in process.env)) process.env[key] = value;
    }
  }
}

loadEnv();

const [cmd, ...args] = process.argv.slice(2);
if (!cmd) {
  console.error("usage: node scripts/with-env.mjs <command> [...args]");
  process.exit(1);
}

const child = spawn(cmd, args, { stdio: "inherit", shell: process.platform === "win32" });
child.on("error", (error) => {
  console.error(`Failed to run "${cmd}": ${error.message}`);
  process.exit(1);
});
child.on("close", (code) => process.exit(code ?? 0));
