import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import path from "node:path";
import * as schema from "./schema";

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

const g = globalThis as unknown as { __brieflet_db?: Promise<Db> };

/**
 * Returns the shared Drizzle instance.
 * - DATABASE_URL set  → Neon serverless (WebSocket pool, supports transactions). Works with Vercel Postgres too.
 * - DATABASE_URL empty → embedded PGlite in ./.pglite, auto-migrated and auto-seeded so `npm run dev` just works.
 */
export function getDb(): Promise<Db> {
  if (!g.__brieflet_db) {
    g.__brieflet_db = createDb().catch((err) => {
      g.__brieflet_db = undefined;
      throw err;
    });
  }
  return g.__brieflet_db;
}

async function createDb(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const { Pool } = await import("@neondatabase/serverless");
    const { drizzle } = await import("drizzle-orm/neon-serverless");
    return drizzle({ client: new Pool({ connectionString: url }), schema }) as unknown as Db;
  }

  if (process.env.VERCEL) {
    throw new Error("DATABASE_URL is not set. Add a Neon / Vercel Postgres database to the project.");
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const client = new PGlite(path.join(process.cwd(), ".pglite"));
  const db = drizzle({ client, schema });
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });

  const existing = await db.select({ id: schema.briefs.id }).from(schema.briefs).limit(1);
  if (existing.length === 0) {
    const { seed } = await import("./seed-data");
    await seed(db as unknown as Db);
    console.log("[brieflet] Local PGlite database seeded with sample briefs.");
  }
  return db as unknown as Db;
}
