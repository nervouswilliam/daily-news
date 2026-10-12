import "./env";
import path from "node:path";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log("[migrate] DATABASE_URL not set. Skipping (local dev uses embedded PGlite, migrated on startup).");
    return;
  }
  const { Pool } = await import("@neondatabase/serverless");
  const { drizzle } = await import("drizzle-orm/neon-serverless");
  const { migrate } = await import("drizzle-orm/neon-serverless/migrator");
  const pool = new Pool({ connectionString: url });
  await migrate(drizzle({ client: pool }), { migrationsFolder: path.join(process.cwd(), "drizzle") });
  await pool.end();
  console.log("[migrate] Database is up to date.");
}

main().catch((err) => {
  console.error("[migrate] failed:", err);
  process.exit(1);
});
