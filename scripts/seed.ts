import "./env";
import { getDb } from "@/lib/db";
import { seed } from "@/lib/db/seed-data";

async function main() {
  const db = await getDb(); // PGlite auto-seeds itself on first boot
  if (process.env.DATABASE_URL) await seed(db);
  console.log("[seed] Sample briefs saved (re-running replaces them, thanks to the upsert).");
  process.exit(0);
}

main().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
