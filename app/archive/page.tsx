import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { latestBriefDate, listArchive, listMonth, listTags, type ArchiveEntry } from "@/lib/briefs/queries";
import { briefTypeSchema, toSgtDate, type BriefType } from "@/lib/briefs/schema";
import { BRIEF_TYPE_META, MOOD_META } from "@/lib/theme";
import { briefPath, storyPath } from "@/lib/site";
import { cn, formatBriefDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Archive", description: "Every past brief, searchable." };

type SP = { type?: string; tag?: string; q?: string; m?: string };

export default async function ArchivePage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const type = briefTypeSchema.safeParse(sp.type).data;
  const tag = sp.tag?.trim() || undefined;
  const q = sp.q?.trim().slice(0, 100) || undefined;
  const month = /^\d{4}-\d{2}$/.test(sp.m ?? "") ? sp.m! : ((await latestBriefDate()) ?? toSgtDate(new Date())).slice(0, 7);

  const [entries, tags, monthBriefs] = await Promise.all([listArchive({ type, tag, q }), listTags(type), listMonth(month, type)]);

  const href = (patch: Partial<SP>) => {
    const next = { type, tag, q, m: sp.m, ...patch };
    const usp = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) if (v) usp.set(k, v);
    const s = usp.toString();
    return s ? `/archive?${s}` : "/archive";
  };

  const searching = Boolean(q || tag);
  const grouped = groupByMonth(entries);

  return (
    <main className="mx-auto max-w-3xl px-4 pb-10 pt-8">
      <h1 className="font-display text-4xl font-extrabold tracking-tight">Archive 🗂️</h1>
      <p className="mt-2 text-lg text-muted">Every brief so far. Tap a day, a tag, or search headlines.</p>

      {/* Filters */}
      <div className="mt-6 space-y-4">
        <form action="/archive" className="relative">
          {type && <input type="hidden" name="type" value={type} />}
          {tag && <input type="hidden" name="tag" value={tag} />}
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search headlines… (e.g. tariffs, DAX, Nvidia)"
            className="h-13 w-full rounded-full bg-surface pl-12 pr-28 text-base ring-1 ring-line outline-none transition focus:ring-2 focus:ring-violet-500"
          />
          <button type="submit" className="absolute right-1.5 top-1.5 h-10 rounded-full bg-ink px-5 text-sm font-bold text-paper">
            Search
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          {([undefined, "daily-news", "powerbi"] as (BriefType | undefined)[]).map((t) => (
            <Link
              key={t ?? "all"}
              href={href({ type: t, tag: undefined })}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-bold transition",
                t === type ? "bg-ink text-paper" : "bg-surface ring-1 ring-line hover:bg-surface-2",
              )}
            >
              {t ? `${BRIEF_TYPE_META[t].emoji} ${BRIEF_TYPE_META[t].label}` : "All briefs"}
            </Link>
          ))}
        </div>

        {tags.length > 0 && (
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            {tags.map((t) => (
              <Link
                key={t}
                href={href({ tag: t === tag ? undefined : t })}
                className={cn(
                  "inline-flex h-8 shrink-0 items-center gap-1 rounded-full px-3 text-[13px] font-semibold transition",
                  t === tag ? "bg-violet-600 text-white" : "bg-surface-2 text-muted hover:text-ink",
                )}
              >
                #{t}
                {t === tag && <X className="size-3.5" />}
              </Link>
            ))}
          </div>
        )}
      </div>

      {!searching && <Calendar month={month} briefs={monthBriefs} href={href} />}

      {/* Timeline */}
      <div className="mt-10">
        {searching && (
          <p className="mb-4 font-semibold text-muted">
            {entries.reduce((n, e) => n + e.matches.length, 0)} matching stories
            {q && (
              <>
                {" "}for <span className="text-ink">&ldquo;{q}&rdquo;</span>
              </>
            )}
            {tag && (
              <>
                {" "}tagged <span className="text-ink">#{tag}</span>
              </>
            )}
            {" · "}
            <Link href={href({ q: undefined, tag: undefined })} className="underline">
              clear
            </Link>
          </p>
        )}
        {entries.length === 0 && <p className="rounded-3xl bg-surface p-10 text-center text-lg text-muted ring-1 ring-line">Nothing here yet 🤷</p>}

        {grouped.map(([label, list]) => (
          <section key={label} className="mb-8">
            <h2 className="sticky top-14 z-10 -mx-4 bg-paper/85 px-4 py-2 font-display text-lg font-extrabold backdrop-blur">{label}</h2>
            <ol className="relative mt-2 space-y-3 border-l-2 border-line pl-5">
              {list.map((e) => (
                <TimelineEntry key={e.id} entry={e} />
              ))}
            </ol>
          </section>
        ))}
      </div>
    </main>
  );
}

function TimelineEntry({ entry: e }: { entry: ArchiveEntry }) {
  const t = BRIEF_TYPE_META[e.briefType];
  const mood = MOOD_META[e.mood];
  return (
    <li className="relative">
      <span className="absolute -left-[27px] top-5 size-3 rounded-full ring-4 ring-paper" style={{ background: t.color }} />
      <div className="rounded-3xl bg-surface p-4 ring-1 ring-line transition hover:shadow-md">
        <Link href={briefPath(e.briefType, e.date)} className="block">
          <div className="flex items-center gap-2 text-sm font-bold text-muted">
            <span>{formatBriefDate(e.date, { weekday: "short", day: "numeric", month: "short" })}</span>
            <span className="rounded-full px-2 py-0.5 text-xs text-white" style={{ background: t.color }}>
              {t.short}
            </span>
            <span title={mood.label}>{mood.emoji}</span>
            <span className="ml-auto text-xs">{e.itemCount} stories</span>
          </div>
          <p className="mt-1.5 font-display text-lg font-bold leading-snug">{e.title}</p>
        </Link>
        {e.matches.length > 0 && (
          <ul className="mt-3 space-y-1.5 border-t border-line pt-3">
            {e.matches.map((m) => (
              <li key={m.id}>
                <Link href={storyPath(e.briefType, e.date, e.storyIndexes[m.id])} className="group flex items-start gap-2 text-[15px]">
                  <span className="mt-0.5 shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-bold text-muted">{m.tag}</span>
                  <span className="font-semibold group-hover:underline">{m.headline}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

function Calendar({
  month,
  briefs,
  href,
}: {
  month: string;
  briefs: { briefType: BriefType; date: string; mood: keyof typeof MOOD_META; title: string }[];
  href: (p: Partial<SP>) => string;
}) {
  const [y, m] = month.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const offset = (first.getUTCDay() + 6) % 7; // Monday-first
  const shift = (d: number) => new Date(Date.UTC(y, m - 1 + d, 1)).toISOString().slice(0, 7);
  const today = toSgtDate(new Date());
  const byDate = new Map<string, typeof briefs>();
  for (const b of briefs) byDate.set(b.date, [...(byDate.get(b.date) ?? []), b]);

  return (
    <section className="mt-8 rounded-[28px] bg-surface p-5 ring-1 ring-line">
      <div className="flex items-center justify-between">
        <Link href={href({ m: shift(-1) })} className="grid size-10 place-items-center rounded-full hover:bg-surface-2" aria-label="Previous month">
          <ChevronLeft className="size-5" />
        </Link>
        <h2 className="font-display text-xl font-extrabold">
          {new Intl.DateTimeFormat("en-SG", { month: "long", year: "numeric", timeZone: "UTC" }).format(first)}
        </h2>
        <Link href={href({ m: shift(1) })} className="grid size-10 place-items-center rounded-full hover:bg-surface-2" aria-label="Next month">
          <ChevronRight className="size-5" />
        </Link>
      </div>
      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-bold text-muted">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1">
        {Array.from({ length: offset }).map((_, i) => (
          <span key={`o${i}`} />
        ))}
        {Array.from({ length: days }).map((_, i) => {
          const date = `${month}-${String(i + 1).padStart(2, "0")}`;
          const list = byDate.get(date) ?? [];
          const primary = list[0];
          const cell = (
            <>
              <span>{i + 1}</span>
              <span className="flex h-1.5 gap-0.5">
                {list.map((b) => (
                  <span key={b.briefType} className="size-1.5 rounded-full" style={{ background: BRIEF_TYPE_META[b.briefType].color }} />
                ))}
              </span>
            </>
          );
          const cls = cn(
            "flex h-12 flex-col items-center justify-center gap-1 rounded-2xl text-sm font-semibold sm:h-14",
            date === today && "ring-2 ring-ink",
          );
          return primary ? (
            <Link
              key={date}
              href={briefPath(primary.briefType, date)}
              title={list.map((b) => `${BRIEF_TYPE_META[b.briefType].short}: ${b.title}`).join("\n")}
              className={cn(cls, "bg-surface-2 transition hover:scale-105 hover:bg-violet-500/15")}
            >
              {cell}
            </Link>
          ) : (
            <span key={date} className={cn(cls, "text-muted/60")}>
              {cell}
            </span>
          );
        })}
      </div>
      <div className="mt-4 flex justify-center gap-4 text-xs font-semibold text-muted">
        {(["daily-news", "powerbi"] as const).map((t) => (
          <span key={t} className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ background: BRIEF_TYPE_META[t].color }} /> {BRIEF_TYPE_META[t].label}
          </span>
        ))}
      </div>
    </section>
  );
}

function groupByMonth(entries: ArchiveEntry[]): [string, ArchiveEntry[]][] {
  const map = new Map<string, ArchiveEntry[]>();
  for (const e of entries) {
    const label = new Intl.DateTimeFormat("en-SG", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${e.date}T00:00:00Z`));
    map.set(label, [...(map.get(label) ?? []), e]);
  }
  return [...map.entries()];
}
