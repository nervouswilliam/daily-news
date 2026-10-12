import Link from "next/link";
import { ArrowDown, ArrowUpRight, Link2 } from "lucide-react";
import { Cover } from "@/components/cover";
import { Illustration } from "@/components/illustrations";
import { DifficultyBadge, MoodBadge, SentimentChip, SourceLine, TagPill } from "@/components/badges";
import { RichText } from "@/components/rich-text";
import { PlayStoriesButton, StoryModeProvider, StoryRings, StoryTrigger } from "@/components/story-mode";
import { CaughtUp, SectionChips, SeenTracker } from "@/components/feed-client";
import { BRIEF_TYPE_META, sectionTheme } from "@/lib/theme";
import { storyPath } from "@/lib/site";
import { briefMeta, toStories, type StoryData } from "@/lib/story";
import { formatBriefDate } from "@/lib/utils";
import type { BriefFull, SectionFull } from "@/lib/briefs/queries";

type Next = { href: string; label: string } | null;

export function BriefView({ brief, next, initialAt }: { brief: BriefFull; next?: Next; initialAt?: number | null }) {
  const stories = toStories(brief);
  const meta = briefMeta(brief);
  return (
    <StoryModeProvider brief={meta} stories={stories} next={next} initialAt={initialAt}>
      <TldrCard brief={brief} storyCount={stories.length} />
      <div className="mt-6">
        <StoryRings />
      </div>

      <div id="feed" className="mt-8">
        <SectionChips sections={brief.sections.map((s) => ({ key: s.key, name: s.name, emoji: s.emoji, count: s.items.length }))} />
        {brief.sections.map((s) => (
          <SectionBlock key={s.id} section={s} stories={stories.filter((st) => st.sectionKey === s.key)} brief={brief} />
        ))}
        <CaughtUp briefId={brief.id} itemIds={stories.map((s) => s.id)} next={next} />
      </div>
    </StoryModeProvider>
  );
}

function TldrCard({ brief, storyCount }: { brief: BriefFull; storyCount: number }) {
  const t = BRIEF_TYPE_META[brief.briefType];
  const colors = brief.sections.slice(0, 3).map((s) => sectionTheme(s.key, s.name));
  const mesh = [
    `radial-gradient(60% 70% at 0% 0%, color-mix(in oklab, ${colors[0]?.from ?? "#7C3AED"} 22%, transparent), transparent)`,
    `radial-gradient(50% 60% at 100% 10%, color-mix(in oklab, ${colors[1]?.from ?? "#3B82F6"} 18%, transparent), transparent)`,
    `radial-gradient(60% 60% at 80% 110%, color-mix(in oklab, ${colors[2]?.to ?? "#F59E0B"} 18%, transparent), transparent)`,
  ].join(",");
  const minutes = Math.max(1, Math.round(storyCount * 0.3 + 1));

  return (
    <section className="relative overflow-hidden rounded-[28px] bg-surface p-6 ring-1 ring-line sm:p-8" style={{ backgroundImage: mesh }}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold text-muted">
          {t.emoji} {t.label} · {formatBriefDate(brief.date)}
        </span>
        <MoodBadge mood={brief.mood} className="ml-auto" />
      </div>
      <h1 className="mt-4 font-display text-[30px] font-extrabold leading-[1.05] tracking-tight text-balance sm:text-[40px]">
        {brief.title}
      </h1>

      <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.14em] text-muted">⏱ The 60-second version</p>
      <ol className="mt-3 space-y-4">
        {brief.tldr.map((b, i) => (
          <li key={i} className="flex gap-4" style={{ ["--accent" as string]: colors[i]?.accent ?? "#7C3AED" }}>
            <span
              className="font-display text-4xl font-extrabold leading-none"
              style={{
                backgroundImage: `linear-gradient(160deg, ${colors[i]?.from ?? "#7C3AED"}, ${colors[i]?.to ?? "#3B82F6"})`,
                WebkitBackgroundClip: "text",
                color: "transparent",
              }}
            >
              {i + 1}
            </span>
            <p className="max-w-[36ch] pt-1 text-[18px] leading-snug">
              <RichText text={b} />
            </p>
          </li>
        ))}
      </ol>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <PlayStoriesButton />
        <a
          href="#feed"
          className="inline-flex h-13 items-center justify-center gap-2 rounded-full px-6 font-bold ring-1 ring-line transition hover:bg-surface-2"
        >
          <ArrowDown className="size-5" /> Scroll the feed
        </a>
        <span className="text-center text-sm text-muted sm:ml-auto">
          {storyCount} stories · ~{minutes} min
        </span>
      </div>
    </section>
  );
}

function SectionBlock({ section, stories, brief }: { section: SectionFull; stories: StoryData[]; brief: BriefFull }) {
  const t = sectionTheme(section.key, section.name);
  return (
    <section id={`sec-${section.key}`} className="mt-10" style={{ ["--accent" as string]: t.accent }}>
      <div
        className="relative h-32 overflow-hidden rounded-[28px] px-6 py-5 text-white sm:h-36"
        style={{ background: `linear-gradient(120deg, ${t.from}, ${t.to})` }}
      >
        <div className="dot-grid absolute inset-0 opacity-50" />
        <Illustration name={t.illos[0]} className="absolute -bottom-10 -right-6 w-48 rotate-[-10deg] text-white opacity-90 sm:w-56" />
        <div className="relative flex h-full flex-col justify-end">
          <span className="text-4xl drop-shadow" aria-hidden="true">
            {section.emoji}
          </span>
          <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{section.name}</h2>
        </div>
      </div>

      {/* Overview as a friendly chat bubble */}
      <div className="mt-4 flex gap-3">
        <span
          className="grid size-9 shrink-0 place-items-center rounded-full text-lg text-white"
          style={{ background: `linear-gradient(135deg, ${t.from}, ${t.to})` }}
          aria-hidden="true"
        >
          {section.emoji}
        </span>
        <p className="max-w-[52ch] rounded-3xl rounded-tl-md bg-surface px-4 py-3 text-[17px] leading-relaxed ring-1 ring-line">
          <RichText text={section.overview} />
        </p>
      </div>

      <div className="mt-5 space-y-5">
        {stories.map((s) => (
          <SeenTracker key={s.id} briefId={brief.id} itemId={s.id}>
            <StoryCard story={s} brief={brief} />
          </SeenTracker>
        ))}
      </div>
    </section>
  );
}

export function StoryCard({ story, brief, standalone = false }: { story: StoryData; brief: Pick<BriefFull, "briefType" | "date">; standalone?: boolean }) {
  const t = sectionTheme(story.sectionKey, story.sectionName);
  const cover = (
    <Cover
      imageUrl={story.imageUrl}
      sectionKey={story.sectionKey}
      sectionName={story.sectionName}
      tag={story.tag}
      headline={story.headline}
      index={story.indexInSection}
        illo={story.illo}
      className="aspect-[16/9] w-full"
    >
      <div className="absolute left-4 top-4 flex flex-wrap gap-2">
        <TagPill tag={story.tag} />
      </div>
      <div className="absolute right-4 top-4 flex gap-2">
        <SentimentChip sentiment={story.sentiment} />
        <DifficultyBadge difficulty={story.difficulty} />
      </div>
    </Cover>
  );

  return (
    <article className="overflow-hidden rounded-[28px] bg-surface shadow-[0_1px_2px_rgba(0,0,0,.04),0_8px_24px_-12px_rgba(0,0,0,.12)] ring-1 ring-line" style={{ ["--accent" as string]: t.accent }}>
      {standalone ? cover : <StoryTrigger n={story.n} label={`Open "${story.headline}" in story mode`}>{cover}</StoryTrigger>}
      <div className="p-5 sm:p-6">
        <SourceLine url={story.url} sourceName={story.sourceName} readMinutes={story.readMinutes} />
        <h3 className="mt-2 font-display text-[24px] font-extrabold leading-[1.12] tracking-tight text-balance sm:text-[26px]">
          {story.headline}
        </h3>
        <p className="mt-2 max-w-[60ch] text-[17px] leading-relaxed text-ink/85">
          <RichText text={story.summary} />
        </p>
        <div
          className="mt-4 rounded-2xl border-l-4 px-4 py-3 text-[15px] leading-snug"
          style={{ borderColor: t.accent, background: `color-mix(in oklab, ${t.accent} 9%, transparent)` }}
        >
          <span className="font-extrabold" style={{ color: t.accent }}>
            💡 Why it matters:{" "}
          </span>
          <RichText text={story.whyItMatters} />
        </div>
        <div className="mt-4 flex items-center gap-2">
          <a
            href={story.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center gap-1.5 rounded-full px-4 font-bold text-white transition hover:brightness-110"
            style={{ background: `linear-gradient(120deg, color-mix(in oklab, ${t.from} 82%, black), color-mix(in oklab, ${t.to} 82%, black))` }}
          >
            Read the full article <ArrowUpRight className="size-4" />
          </a>
          {!standalone && (
            <Link
              href={storyPath(brief.briefType, brief.date, story.n)}
              className="ml-auto grid size-11 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-ink"
              aria-label="Shareable link to this story"
              title="Shareable link"
            >
              <Link2 className="size-5" />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
