Drizzle and Neon are a natural pair on a serverless host: Neon gives you a PostgreSQL database that scales to zero, and Drizzle gives you a typed schema that ships with your code. This is the setup I use, in the order I actually do it.

## 1. Install the driver and the ORM

```
npm install drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit
```

The `@neondatabase/serverless` driver is the piece that matters. It speaks HTTP to Neon, so it works in edge and serverless runtimes where a long-lived TCP socket is not an option.

## 2. Point at the database

Put the connection string in `.env.local` and never in the repository:

```
DATABASE_URL=postgresql://user:password@host/db?sslmode=require
```

Then create the client once and export it:

```
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

One client, imported everywhere. Recreating it per request throws away the connection pooling Neon already does for you.

## 3. Describe the schema in TypeScript

```
import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

This file is the source of truth. Types for rows are inferred from it, so `typeof posts.$inferSelect` is the row shape and `$inferInsert` is what you may write.

## 4. Generate and apply migrations

```
npx drizzle-kit generate
npx drizzle-kit migrate
```

Generation diffs your schema against the previous snapshot and writes SQL. Treat that SQL as reviewable code — read it before it runs, especially anything that drops a column.

## 5. Query with full type safety

```
import { eq } from "drizzle-orm";
import { db } from "./index";
import { posts } from "./schema";

export async function getPublishedPosts() {
  return db
    .select()
    .from(posts)
    .where(eq(posts.published, true))
    .orderBy(posts.createdAt);
}
```

The return type is inferred. Rename a column in the schema and every query that touches it fails to compile, which is exactly the feedback you want before a deploy.

## A note on migrations in production

Run migrations as a deliberate step, not on every request. I keep a script that loads the environment and runs `drizzle-kit migrate`, and I run it once per deploy. The application code only ever reads and writes through the typed client — it never tries to reshape the database underneath itself.

That is the whole setup: one driver, one schema file, generated SQL you can read, and types that travel from Postgres all the way into the component.
