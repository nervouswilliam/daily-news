import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Play } from "lucide-react";
import { StoryCard } from "@/components/brief-view";
import { getBrief } from "@/lib/briefs/queries";
import { briefTypeSchema } from "@/lib/briefs/schema";
import { toStories } from "@/lib/story";
import { BRIEF_TYPE_META } from "@/lib/theme";
import { briefPath, storyPath } from "@/lib/site";
import { formatBriefDate, plain } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Params = { type: string; date: string; n: string };

async function load(p: Params) {
  const type = briefTypeSchema.safeParse(p.type);
  const n = Number(p.n);
  if (!type.success || !/^\d{4}-\d{2}-\d{2}$/.test(p.date) || !Number.isInteger(n)) return null;
  const brief = await getBrief(type.data, p.date);
  if (!brief) return null;
  const stories = toStories(brief);
  const story = stories[n - 1];
  return story ? { brief, story, stories } : null;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const data = await load(await params);
  if (!data) return { title: "Story not found" };
  const { story } = data;
  const description = `${plain(story.summary)} Why it matters: ${plain(story.whyItMatters)}`;
  return {
    title: story.headline,
    description,
    openGraph: { title: story.headline, description, type: "article" },
    twitter: { card: "summary_large_image", title: story.headline, description },
  };
}

export default async function StoryPage({ params }: { params: Promise<Params> }) {
  const data = await load(await params);
  if (!data) notFound();
  const { brief, story, stories } = data;
  const prev = stories[story.n - 2];
  const next = stories[story.n];

  return (
    <main className="mx-auto max-w-2xl px-4 pb-10 pt-6">
      <Link href={briefPath(brief.briefType, brief.date)} className="inline-flex items-center gap-1.5 text-sm font-bold text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> {BRIEF_TYPE_META[brief.briefType].label} · {formatBriefDate(brief.date)}
      </Link>
      <p className="mt-4 text-sm font-bold text-muted">
        {story.sectionEmoji} {story.sectionName} · Story {story.n} of {stories.length}
      </p>
      <div className="mt-3">
        <StoryCard story={story} brief={brief} standalone />
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link
          href={`${briefPath(brief.briefType, brief.date)}?story=${story.n}`}
          className="inline-flex h-13 flex-1 items-center justify-center gap-2 rounded-full bg-ink px-6 font-bold text-paper"
        >
          <Play className="size-5 fill-current" /> Continue in story mode
        </Link>
        <Link
          href={briefPath(brief.briefType, brief.date)}
          className="inline-flex h-13 flex-1 items-center justify-center rounded-full px-6 font-bold ring-1 ring-line hover:bg-surface-2"
        >
          See the whole brief
        </Link>
      </div>

      <nav className="mt-8 grid grid-cols-2 gap-3 text-sm">
        {prev ? (
          <Link href={storyPath(brief.briefType, brief.date, prev.n)} className="rounded-2xl bg-surface p-4 ring-1 ring-line hover:bg-surface-2">
            <span className="flex items-center gap-1 font-bold text-muted">
              <ArrowLeft className="size-4" /> Previous
            </span>
            <span className="mt-1 line-clamp-2 font-semibold">{prev.headline}</span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={storyPath(brief.briefType, brief.date, next.n)} className="rounded-2xl bg-surface p-4 text-right ring-1 ring-line hover:bg-surface-2">
            <span className="flex items-center justify-end gap-1 font-bold text-muted">
              Next <ArrowRight className="size-4" />
            </span>
            <span className="mt-1 line-clamp-2 font-semibold">{next.headline}</span>
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </main>
  );
}
