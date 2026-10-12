import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BriefView } from "@/components/brief-view";
import { getAdjacentDates, getBrief } from "@/lib/briefs/queries";
import { briefTypeSchema } from "@/lib/briefs/schema";
import { BRIEF_TYPE_META } from "@/lib/theme";
import { briefPath } from "@/lib/site";
import { formatBriefDate, plain } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Params = { type: string; date: string };

async function load(p: Params) {
  const type = briefTypeSchema.safeParse(p.type);
  if (!type.success || !/^\d{4}-\d{2}-\d{2}$/.test(p.date)) return null;
  return getBrief(type.data, p.date);
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const brief = await load(await params);
  if (!brief) return { title: "Brief not found" };
  const label = `${BRIEF_TYPE_META[brief.briefType].label} · ${formatBriefDate(brief.date, { day: "numeric", month: "short" })}`;
  const description = brief.tldr.map(plain).join(" ");
  return {
    title: `${brief.title} (${label})`,
    description,
    openGraph: { title: brief.title, description, type: "article" },
    twitter: { card: "summary_large_image", title: brief.title, description },
  };
}

export default async function BriefPage({ params, searchParams }: { params: Promise<Params>; searchParams: Promise<{ story?: string }> }) {
  const [p, sp] = await Promise.all([params, searchParams]);
  const brief = await load(p);
  if (!brief) notFound();
  const adj = await getAdjacentDates(brief.briefType, brief.date);

  return (
    <main className="mx-auto max-w-2xl px-4 pb-10 pt-6">
      <nav className="mb-5 flex items-center justify-between text-sm font-bold">
        {adj.prev ? (
          <Link href={briefPath(brief.briefType, adj.prev)} className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-muted hover:bg-surface-2 hover:text-ink">
            <ChevronLeft className="size-4" /> {formatBriefDate(adj.prev, { day: "numeric", month: "short" })}
          </Link>
        ) : (
          <span />
        )}
        {adj.next ? (
          <Link href={briefPath(brief.briefType, adj.next)} className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-muted hover:bg-surface-2 hover:text-ink">
            {formatBriefDate(adj.next, { day: "numeric", month: "short" })} <ChevronRight className="size-4" />
          </Link>
        ) : (
          <span />
        )}
      </nav>
      <BriefView
        brief={brief}
        initialAt={sp.story ? Number(sp.story) || 1 : null}
        next={adj.next ? { href: briefPath(brief.briefType, adj.next), label: "Next day's brief" } : { href: "/", label: "Back to today" }}
      />
    </main>
  );
}
