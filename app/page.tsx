import Link from "next/link";
import { BriefView } from "@/components/brief-view";
import { getLatestBriefs } from "@/lib/briefs/queries";
import { briefTypeSchema, toSgtDate, type BriefType } from "@/lib/briefs/schema";
import { BRIEF_TYPE_META } from "@/lib/theme";
import { briefPath } from "@/lib/site";
import { cn, formatBriefDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ t?: string; story?: string }> }) {
  const sp = await searchParams;
  const latest = await getLatestBriefs();

  if (latest.length === 0) return <EmptyState />;

  const requested = briefTypeSchema.safeParse(sp.t);
  // Default: the most recent brief; on a tie, the Daily Brief comes first.
  const fallback = [...latest].sort((a, b) => b.date.localeCompare(a.date))[0];
  const brief = (requested.success && latest.find((b) => b.briefType === requested.data)) || fallback;
  const other = latest.find((b) => b.briefType !== brief.briefType);
  const today = toSgtDate(new Date());

  return (
    <main className="mx-auto max-w-2xl px-4 pb-10 pt-6">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-muted">{brief.date === today ? "Today" : "Latest"}</p>
          <p className="font-display text-2xl font-extrabold tracking-tight">{greeting()} 👋</p>
        </div>
        {latest.length > 1 && <TypeSwitcher current={brief.briefType} available={latest.map((b) => ({ type: b.briefType, date: b.date }))} today={today} />}
      </div>
      <BriefView
        key={brief.id}
        brief={brief}
        initialAt={sp.story ? Number(sp.story) || 1 : null}
        next={other ? { href: `/?t=${other.briefType}`, label: `Next: ${BRIEF_TYPE_META[other.briefType].label}` } : { href: "/archive", label: "Browse the archive" }}
      />
    </main>
  );
}

function greeting() {
  const h = Number(new Intl.DateTimeFormat("en-SG", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Singapore" }).format(new Date()));
  if (h < 5) return "Up late";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function TypeSwitcher({ current, available, today }: { current: BriefType; available: { type: BriefType; date: string }[]; today: string }) {
  return (
    <div className="flex rounded-full bg-surface p-1 ring-1 ring-line">
      {available.map(({ type, date }) => {
        const m = BRIEF_TYPE_META[type];
        const on = type === current;
        return (
          <Link
            key={type}
            href={`/?t=${type}`}
            scroll={false}
            className={cn(
              "relative inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-bold transition",
              on ? "bg-ink text-paper shadow" : "text-muted hover:text-ink",
            )}
            title={formatBriefDate(date)}
          >
            <span aria-hidden="true">{m.emoji}</span>
            {m.short}
            {date === today && !on && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-rose-500" aria-label="new today" />}
          </Link>
        );
      })}
    </div>
  );
}

function EmptyState() {
  return (
    <main className="mx-auto max-w-xl px-4 py-24 text-center">
      <div className="text-6xl">📭</div>
      <h1 className="mt-6 font-display text-3xl font-extrabold">No briefs yet</h1>
      <p className="mt-3 text-lg text-muted">
        Once your scheduled task calls <code className="rounded bg-surface-2 px-1.5 py-0.5 text-base">save_brief</code>, today&apos;s brief shows up here.
        For local testing, run <code className="rounded bg-surface-2 px-1.5 py-0.5 text-base">npm run db:seed</code>.
      </p>
      <Link href={briefPath("daily-news", toSgtDate(new Date()))} className="mt-8 inline-block font-bold underline">
        Check today&apos;s Daily Brief
      </Link>
    </main>
  );
}
