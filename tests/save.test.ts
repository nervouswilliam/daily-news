import { beforeEach, describe, expect, it, vi } from "vitest";
import { asc, eq } from "drizzle-orm";
import { briefInputSchema } from "@/lib/briefs/schema";
import { saveBrief } from "@/lib/briefs/save";
import { listRecentUrls } from "@/lib/briefs/queries";
import { briefs, items, sections } from "@/lib/db/schema";
import type { Db } from "@/lib/db";
import { testDb, validBrief } from "./helpers";

const noMeta = async () => ({ ogImage: null, readMinutes: null });

let db: Db;
beforeEach(async () => {
  db = await testDb();
});

describe("saveBrief", () => {
  it("creates a brief with sections and items in order", async () => {
    const res = await saveBrief(db, briefInputSchema.parse(validBrief()), { fetchMeta: noMeta });
    expect(res).toMatchObject({ created: true, sectionCount: 1, itemCount: 2, imagesFound: 1 });

    const rows = await db.select().from(items).where(eq(items.briefId, res.briefId)).orderBy(asc(items.position));
    expect(rows.map((r) => r.headline)).toEqual(["Model ships", "Chip news"]);
    expect(rows[1]).toMatchObject({ imageUrl: "https://img.example.com/b.jpg", imageSource: "provided" });
    expect(rows[0].readMinutes).toBeGreaterThan(0); // guessed when the article can't be fetched
  });

  it("upserts by (briefType, date): a re-run replaces, never duplicates", async () => {
    const first = await saveBrief(db, briefInputSchema.parse(validBrief()), { fetchMeta: noMeta });

    const rerun = validBrief({ title: "Re-run", mood: "wild" });
    rerun.sections[0].items = rerun.sections[0].items.slice(0, 1);
    const second = await saveBrief(db, briefInputSchema.parse(rerun), { fetchMeta: noMeta });

    expect(second.created).toBe(false);
    expect(second.briefId).toBe(first.briefId);
    const all = await db.select().from(briefs);
    expect(all).toHaveLength(1);
    expect(all[0]).toMatchObject({ title: "Re-run", mood: "wild" });
    expect(await db.select().from(sections)).toHaveLength(1);
    expect(await db.select().from(items)).toHaveLength(1);
  });

  it("keeps different brief types on the same date separate", async () => {
    await saveBrief(db, briefInputSchema.parse(validBrief()), { fetchMeta: noMeta });
    await saveBrief(db, briefInputSchema.parse(validBrief({ briefType: "powerbi" })), { fetchMeta: noMeta });
    expect(await db.select().from(briefs)).toHaveLength(2);
  });

  it("fills og:image from the article when no imageUrl is given, but never overrides a provided one", async () => {
    const fetchMeta = vi.fn(async (url: string) => ({
      ogImage: `https://og.example.com${new URL(url).pathname}.png`,
      readMinutes: 7,
    }));
    await saveBrief(db, briefInputSchema.parse(validBrief()), { fetchMeta });
    const rows = await db.select().from(items).orderBy(asc(items.position));
    expect(fetchMeta).toHaveBeenCalledTimes(2);
    expect(rows[0]).toMatchObject({ imageUrl: "https://og.example.com/a.png", imageSource: "og", readMinutes: 7 });
    expect(rows[1]).toMatchObject({ imageUrl: "https://img.example.com/b.jpg", imageSource: "provided" });
  });

  it("skips network enrichment when enrich=false", async () => {
    const fetchMeta = vi.fn(noMeta);
    await saveBrief(db, briefInputSchema.parse(validBrief()), { enrich: false, fetchMeta });
    expect(fetchMeta).not.toHaveBeenCalled();
  });
});

describe("listRecentUrls", () => {
  it("returns URLs from the last 7 days for the requested type only", async () => {
    const recent = validBrief({ date: "2026-10-10" });
    const old = validBrief({ date: "2026-09-20" });
    old.sections[0].items[0].url = "https://example.com/old";
    const other = validBrief({ briefType: "powerbi", date: "2026-10-11" });
    other.sections[0].items[0].url = "https://example.com/pbi";
    for (const b of [recent, old, other]) await saveBrief(db, briefInputSchema.parse(b), { fetchMeta: noMeta });

    const res = await listRecentUrls(db, "daily-news", 7, new Date("2026-10-12T03:00:00Z"));
    expect(res.items.map((i) => i.url)).toEqual(["https://example.com/a", "https://example.com/b"]);
    expect(res.since).toBe("2026-10-05");
  });
});
