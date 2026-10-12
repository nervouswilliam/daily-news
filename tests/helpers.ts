import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "@/lib/db/schema";
import type { Db } from "@/lib/db";
import type { BriefInputRaw } from "@/lib/briefs/schema";

export async function testDb(): Promise<Db> {
  const db = drizzle({ client: new PGlite(), schema });
  await migrate(db, { migrationsFolder: path.join(import.meta.dirname, "..", "drizzle") });
  return db as unknown as Db;
}

export function validBrief(overrides: Partial<BriefInputRaw> = {}): BriefInputRaw {
  return {
    briefType: "daily-news",
    date: "2026-10-12",
    title: "Test brief",
    mood: "calm",
    tldr: ["One thing happened.", "Another thing happened.", "A third thing happened."],
    sections: [
      {
        key: "ai",
        name: "AI",
        emoji: "🤖",
        overview: "A short overview of AI news today.",
        items: [
          {
            headline: "Model ships",
            summary: "A model shipped with **big gains**.",
            whyItMatters: "Costs go down.",
            url: "https://example.com/a",
            sourceName: "Example",
            tag: "Model release",
          },
          {
            headline: "Chip news",
            summary: "A chip was announced today.",
            whyItMatters: "Faster inference.",
            url: "https://example.com/b",
            sourceName: "Example",
            imageUrl: "https://img.example.com/b.jpg",
            tag: "Chips",
          },
        ],
      },
    ],
    ...overrides,
  };
}
