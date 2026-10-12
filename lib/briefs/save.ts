import { and, eq, sql } from "drizzle-orm";
import type { Db } from "@/lib/db";
import { briefs, items, sections } from "@/lib/db/schema";
import { fetchPageMeta, guessReadMinutes, mapLimit, type PageMeta } from "./enrich";
import type { BriefInput } from "./schema";

export type SaveOptions = {
  /** Fetch og:image + read time for each article (default true). */
  enrich?: boolean;
  /** Injectable for tests. */
  fetchMeta?: (url: string) => Promise<PageMeta>;
};

export type SaveResult = {
  briefId: number;
  created: boolean;
  sectionCount: number;
  itemCount: number;
  imagesFound: number;
};

export async function saveBrief(db: Db, input: BriefInput, opts: SaveOptions = {}): Promise<SaveResult> {
  const enrich = opts.enrich ?? true;
  const fetchMeta = opts.fetchMeta ?? ((u: string) => fetchPageMeta(u));

  // Network work happens before the transaction so we never hold a DB transaction open on slow sites.
  const flat = input.sections.flatMap((s) => s.items);
  const metas: PageMeta[] = enrich
    ? await mapLimit(flat, 6, (it) => fetchMeta(it.url))
    : flat.map(() => ({ ogImage: null, readMinutes: null }));

  let imagesFound = 0;
  return db.transaction(async (tx) => {
    const existing = await tx
      .select({ id: briefs.id })
      .from(briefs)
      .where(and(eq(briefs.briefType, input.briefType), eq(briefs.date, input.date)))
      .limit(1);

    const [row] = await tx
      .insert(briefs)
      .values({ briefType: input.briefType, date: input.date, title: input.title, tldr: input.tldr, mood: input.mood })
      .onConflictDoUpdate({
        target: [briefs.briefType, briefs.date],
        set: { title: input.title, tldr: input.tldr, mood: input.mood, updatedAt: sql`now()` },
      })
      .returning({ id: briefs.id });

    // A re-run fully replaces the content: drop old sections (items cascade).
    await tx.delete(sections).where(eq(sections.briefId, row.id));

    let flatIdx = 0;
    for (const [sIdx, s] of input.sections.entries()) {
      const [sec] = await tx
        .insert(sections)
        .values({ briefId: row.id, key: s.key, name: s.name, emoji: s.emoji, overview: s.overview, position: sIdx })
        .returning({ id: sections.id });

      const values = s.items.map((it, iIdx) => {
        const meta = metas[flatIdx++];
        const provided = it.imageUrl ?? null;
        const imageUrl = provided ?? meta.ogImage;
        if (imageUrl) imagesFound++;
        return {
          sectionId: sec.id,
          briefId: row.id,
          headline: it.headline,
          summary: it.summary,
          whyItMatters: it.whyItMatters,
          url: it.url,
          sourceName: it.sourceName,
          imageUrl,
          imageSource: provided ? ("provided" as const) : meta.ogImage ? ("og" as const) : ("none" as const),
          tag: it.tag,
          sentiment: it.sentiment ?? null,
          difficulty: it.difficulty ?? null,
          readMinutes: meta.readMinutes ?? guessReadMinutes(it.summary),
          position: iIdx,
        };
      });
      await tx.insert(items).values(values);
    }

    return {
      briefId: row.id,
      created: existing.length === 0,
      sectionCount: input.sections.length,
      itemCount: flat.length,
      imagesFound,
    };
  });
}
