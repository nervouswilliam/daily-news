import { and, asc, desc, eq, gte, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { getDb, type Db } from "@/lib/db";
import { briefs, items, sections, type BriefRow, type ItemRow, type SectionRow } from "@/lib/db/schema";
import { toSgtDate, type BriefType } from "./schema";

export type SectionFull = SectionRow & { items: ItemRow[] };
export type BriefFull = BriefRow & { sections: SectionFull[] };

async function hydrate(db: Db, rows: BriefRow[]): Promise<BriefFull[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((b) => b.id);
  const [secs, its] = await Promise.all([
    db.select().from(sections).where(inArray(sections.briefId, ids)).orderBy(asc(sections.position)),
    db.select().from(items).where(inArray(items.briefId, ids)).orderBy(asc(items.position)),
  ]);
  return rows.map((b) => ({
    ...b,
    sections: secs
      .filter((s) => s.briefId === b.id)
      .map((s) => ({ ...s, items: its.filter((i) => i.sectionId === s.id) })),
  }));
}

export async function getBrief(type: BriefType, date: string): Promise<BriefFull | null> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(briefs)
    .where(and(eq(briefs.briefType, type), eq(briefs.date, date)))
    .limit(1);
  return (await hydrate(db, rows))[0] ?? null;
}

/** Most recent brief of each type (daily news first). */
export async function getLatestBriefs(): Promise<BriefFull[]> {
  const db = await getDb();
  const rows = await Promise.all(
    (["daily-news", "powerbi"] as const).map((t) =>
      db.select().from(briefs).where(eq(briefs.briefType, t)).orderBy(desc(briefs.date)).limit(1),
    ),
  );
  return hydrate(db, rows.flat());
}

export async function getAdjacentDates(type: BriefType, date: string) {
  const db = await getDb();
  const [prev, next] = await Promise.all([
    db
      .select({ date: briefs.date })
      .from(briefs)
      .where(and(eq(briefs.briefType, type), sql`${briefs.date} < ${date}`))
      .orderBy(desc(briefs.date))
      .limit(1),
    db
      .select({ date: briefs.date })
      .from(briefs)
      .where(and(eq(briefs.briefType, type), sql`${briefs.date} > ${date}`))
      .orderBy(asc(briefs.date))
      .limit(1),
  ]);
  return { prev: prev[0]?.date ?? null, next: next[0]?.date ?? null };
}

export async function listRecentUrls(db: Db, type: BriefType, days = 7, now = new Date()) {
  const since = toSgtDate(new Date(now.getTime() - days * 86_400_000));
  const rows = await db
    .select({ url: items.url, headline: items.headline, date: briefs.date })
    .from(items)
    .innerJoin(briefs, eq(items.briefId, briefs.id))
    .innerJoin(sections, eq(items.sectionId, sections.id))
    .where(and(eq(briefs.briefType, type), gte(briefs.date, since)))
    .orderBy(desc(briefs.date), asc(sections.position), asc(items.position));
  return { since, items: rows };
}

export type ArchiveFilters = { type?: BriefType; tag?: string; q?: string };

export type ArchiveEntry = Pick<BriefRow, "id" | "briefType" | "date" | "title" | "mood"> & {
  itemCount: number;
  matches: Pick<ItemRow, "id" | "headline" | "tag" | "position" | "sectionId">[];
  storyIndexes: Record<number, number>;
};

export async function listArchive(filters: ArchiveFilters, limit = 120): Promise<ArchiveEntry[]> {
  const db = await getDb();
  const searching = Boolean(filters.q || filters.tag);

  const itemConds: SQL[] = [];
  if (filters.tag) itemConds.push(eq(items.tag, filters.tag));
  if (filters.q) {
    const pat = `%${filters.q.replace(/[%_\\]/g, "\\$&")}%`;
    itemConds.push(or(ilike(items.headline, pat), ilike(items.summary, pat))!);
  }

  const briefConds: SQL[] = [];
  if (filters.type) briefConds.push(eq(briefs.briefType, filters.type));

  const rows = await db
    .select({ id: briefs.id, briefType: briefs.briefType, date: briefs.date, title: briefs.title, mood: briefs.mood })
    .from(briefs)
    .where(briefConds.length ? and(...briefConds) : undefined)
    .orderBy(desc(briefs.date), asc(briefs.briefType))
    .limit(limit);
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  // Story numbers on share URLs are 1-based positions across the whole brief, ordered by section then item.
  const all = await db
    .select({
      id: items.id,
      briefId: items.briefId,
      headline: items.headline,
      tag: items.tag,
      position: items.position,
      sectionId: items.sectionId,
      sectionPos: sections.position,
    })
    .from(items)
    .innerJoin(sections, eq(items.sectionId, sections.id))
    .where(inArray(items.briefId, ids))
    .orderBy(asc(sections.position), asc(items.position));

  const matched = searching
    ? new Set(
        (
          await db
            .select({ id: items.id })
            .from(items)
            .where(and(inArray(items.briefId, ids), ...itemConds))
        ).map((r) => r.id),
      )
    : null;

  const out: ArchiveEntry[] = [];
  for (const r of rows) {
    const mine = all.filter((i) => i.briefId === r.id);
    const storyIndexes: Record<number, number> = {};
    mine.forEach((i, idx) => (storyIndexes[i.id] = idx + 1));
    const matches = matched ? mine.filter((i) => matched.has(i.id)) : [];
    if (searching && matches.length === 0) continue;
    out.push({ ...r, itemCount: mine.length, matches, storyIndexes });
  }
  return out;
}

/** Brief dates in a calendar month ("YYYY-MM"), for the archive calendar. */
export async function listMonth(month: string, type?: BriefType) {
  const db = await getDb();
  const [y, m] = month.split("-").map(Number);
  const start = `${month}-01`;
  const end = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10);
  const conds: SQL[] = [gte(briefs.date, start), sql`${briefs.date} < ${end}`];
  if (type) conds.push(eq(briefs.briefType, type));
  return db
    .select({ briefType: briefs.briefType, date: briefs.date, mood: briefs.mood, title: briefs.title })
    .from(briefs)
    .where(and(...conds))
    .orderBy(asc(briefs.date));
}

export async function latestBriefDate(): Promise<string | null> {
  const db = await getDb();
  const [r] = await db.select({ date: briefs.date }).from(briefs).orderBy(desc(briefs.date)).limit(1);
  return r?.date ?? null;
}

export async function listTags(type?: BriefType): Promise<string[]> {
  const db = await getDb();
  const rows = await db
    .selectDistinct({ tag: items.tag })
    .from(items)
    .innerJoin(briefs, eq(items.briefId, briefs.id))
    .where(type ? eq(briefs.briefType, type) : undefined)
    .orderBy(asc(items.tag));
  return rows.map((r) => r.tag);
}

/** Flatten a brief into a story list (used by story mode, story share pages). */
export function flattenStories(brief: BriefFull) {
  return brief.sections.flatMap((s) => s.items.map((item) => ({ item, section: s })));
}
