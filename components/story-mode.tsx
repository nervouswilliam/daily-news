"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, type PanInfo } from "motion/react";
import { ArrowRight, ChevronLeft, ChevronRight, Lightbulb, Play, RotateCcw, Share2, X } from "lucide-react";
import { Cover } from "@/components/cover";
import { DifficultyBadge, SentimentChip, SourceLine, TagPill } from "@/components/badges";
import { RichText } from "@/components/rich-text";
import { useStreak } from "@/components/chrome";
import { getReadIds, markRead, onReadingChange } from "@/lib/reading";
import { sectionTheme } from "@/lib/theme";
import { storyPath } from "@/lib/site";
import { cn } from "@/lib/utils";
import type { BriefMeta, StoryData } from "@/lib/story";

type Ctx = { open: (n?: number) => void; stories: StoryData[]; brief: BriefMeta; readIds: Set<number> };
const StoryCtx = createContext<Ctx | null>(null);

function useStoryMode() {
  const ctx = useContext(StoryCtx);
  if (!ctx) throw new Error("StoryMode components must be inside <StoryModeProvider>");
  return ctx;
}

export function StoryModeProvider({
  brief,
  stories,
  next,
  initialAt,
  children,
}: {
  brief: BriefMeta;
  stories: StoryData[];
  /** Optional "up next" brief shown on the end screen. */
  next?: { href: string; label: string } | null;
  /** Open immediately at this 1-based story number (e.g. from ?story=3). */
  initialAt?: number | null;
  children: React.ReactNode;
}) {
  const [openAt, setOpenAt] = useState<number | null>(null);
  const [readIds, setReadIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (initialAt && stories.length) setOpenAt(Math.min(Math.max(initialAt, 1), stories.length) - 1);
  }, [initialAt, stories.length]);

  useEffect(() => {
    setReadIds(getReadIds(brief.id));
    return onReadingChange(() => setReadIds(getReadIds(brief.id)));
  }, [brief.id]);

  const open = useCallback(
    (n?: number) => {
      if (!stories.length) return;
      if (n) return setOpenAt(n - 1);
      // Resume at the first unread story.
      const firstUnread = stories.findIndex((s) => !readIds.has(s.id));
      setOpenAt(firstUnread === -1 ? 0 : firstUnread);
    },
    [stories, readIds],
  );

  const value = useMemo(() => ({ open, stories, brief, readIds }), [open, stories, brief, readIds]);
  return (
    <StoryCtx.Provider value={value}>
      {children}
      <AnimatePresence>
        {openAt !== null && (
          <StoryViewer key="viewer" brief={brief} stories={stories} start={openAt} next={next} onClose={() => setOpenAt(null)} />
        )}
      </AnimatePresence>
    </StoryCtx.Provider>
  );
}

/* ---------- Launchers ---------- */

export function PlayStoriesButton({ className }: { className?: string }) {
  const { open, stories, readIds } = useStoryMode();
  const unread = stories.filter((s) => !readIds.has(s.id)).length;
  const label = unread === 0 ? "Watch again" : unread < stories.length ? `Continue · ${unread} left` : `Story mode · ${stories.length}`;
  return (
    <button
      type="button"
      onClick={() => open(unread === 0 ? 1 : undefined)}
      className={cn(
        "inline-flex h-13 items-center justify-center gap-2 rounded-full bg-ink px-6 text-base font-bold text-paper shadow-lg shadow-black/10 transition hover:scale-[1.02] active:scale-[0.98]",
        className,
      )}
    >
      <Play className="size-5 fill-current" />
      {label}
    </button>
  );
}

export function StoryTrigger({ n, children, className, label }: { n: number; children: React.ReactNode; className?: string; label: string }) {
  const { open } = useStoryMode();
  return (
    <button type="button" onClick={() => open(n)} className={cn("block w-full text-left", className)} aria-label={label}>
      {children}
    </button>
  );
}

/** Instagram-style rings, one per section. Grey once every story in the section has been read. */
export function StoryRings() {
  const { open, stories, readIds } = useStoryMode();
  const sections = useMemo(() => {
    const m = new Map<string, { key: string; name: string; emoji: string; first: number; ids: number[] }>();
    for (const s of stories) {
      const e = m.get(s.sectionKey) ?? { key: s.sectionKey, name: s.sectionName, emoji: s.sectionEmoji, first: s.n, ids: [] };
      e.ids.push(s.id);
      m.set(s.sectionKey, e);
    }
    return [...m.values()];
  }, [stories]);

  return (
    <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-1">
      {sections.map((s) => {
        const t = sectionTheme(s.key, s.name);
        const done = s.ids.every((id) => readIds.has(id));
        return (
          <button key={s.key} type="button" onClick={() => open(s.first)} className="group flex w-18 shrink-0 flex-col items-center gap-1.5">
            <span
              className="grid size-17 place-items-center rounded-full p-[3px] transition group-hover:scale-105 group-active:scale-95"
              style={{ background: done ? "var(--line)" : `conic-gradient(from 200deg, ${t.from}, ${t.to}, ${t.from})` }}
            >
              <span className="grid size-full place-items-center rounded-full border-[3px] border-paper bg-surface-2 text-2xl">
                {s.emoji}
              </span>
            </span>
            <span className={cn("w-full truncate text-center text-xs font-semibold", done ? "text-muted" : "text-ink")}>{s.name}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Viewer ---------- */

const swipeVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? "60%" : "-60%", opacity: 0, scale: 0.94 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? "-40%" : "40%", opacity: 0, scale: 0.94 }),
};

function StoryViewer({
  brief,
  stories,
  start,
  next,
  onClose,
}: {
  brief: BriefMeta;
  stories: StoryData[];
  start: number;
  next?: { href: string; label: string } | null;
  onClose: () => void;
}) {
  const [[index, dir], setState] = useState<[number, number]>([start, 0]);
  const seen = useRef(new Set<number>());
  const [toast, setToast] = useState<string | null>(null);
  const atEnd = index >= stories.length;
  const story = atEnd ? null : stories[index];

  const go = useCallback(
    (delta: number) =>
      setState(([i]) => {
        const n = Math.min(Math.max(i + delta, 0), stories.length);
        return [n, delta];
      }),
    [stories.length],
  );

  useEffect(() => {
    if (story) {
      seen.current.add(story.id);
      markRead(brief.id, story.id);
    }
  }, [story, brief.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [go, onClose]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const { offset, velocity } = info;
    if (offset.y > 120 && Math.abs(offset.y) > Math.abs(offset.x)) return onClose();
    if (offset.x < -60 || velocity.x < -500) go(1);
    else if (offset.x > 60 || velocity.x > 500) go(-1);
  };

  const share = async () => {
    if (!story) return;
    const url = `${location.origin}${storyPath(brief.briefType, brief.date, story.n)}`;
    try {
      if (navigator.share) await navigator.share({ title: story.headline, url });
      else {
        await navigator.clipboard.writeText(url);
        setToast("Link copied ✨");
        setTimeout(() => setToast(null), 1600);
      }
    } catch {
      /* user cancelled */
    }
  };

  const theme = story ? sectionTheme(story.sectionKey, story.sectionName) : null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label="Story mode"
    >
      {/* Ambient section colour behind the card on desktop */}
      {theme && (
        <div
          className="pointer-events-none absolute inset-0 opacity-40 transition-[background] duration-700"
          style={{ background: `radial-gradient(60% 50% at 50% 40%, ${theme.from}, transparent)` }}
        />
      )}

      <button
        type="button"
        onClick={() => go(-1)}
        disabled={index === 0}
        className="absolute left-[max(1rem,calc(50%-19rem))] top-1/2 z-10 hidden size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-0 md:grid"
        aria-label="Previous story"
      >
        <ChevronLeft className="size-6" />
      </button>
      <button
        type="button"
        onClick={() => go(1)}
        disabled={atEnd}
        className="absolute right-[max(1rem,calc(50%-19rem))] top-1/2 z-10 hidden size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-0 md:grid"
        aria-label="Next story"
      >
        <ChevronRight className="size-6" />
      </button>

      <div className="relative h-dvh w-full overflow-hidden bg-[#0b0b10] md:h-[min(92dvh,860px)] md:w-[440px] md:rounded-[32px] md:shadow-2xl">
        {/* Progress bars */}
        <div className="absolute inset-x-0 top-0 z-20 flex gap-1 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          {stories.map((s, i) => (
            <div key={s.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/25">
              <motion.div
                className="h-full rounded-full bg-white"
                initial={false}
                animate={{ width: i < index ? "100%" : i === index ? "100%" : "0%" }}
                transition={{ duration: i === index ? 0.5 : 0.2, ease: "easeOut" }}
              />
            </div>
          ))}
        </div>

        <div className="absolute inset-x-0 top-0 z-20 flex items-center gap-2 px-4 pt-[max(1.75rem,calc(env(safe-area-inset-top)+1rem))]">
          {story ? (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold text-white shadow"
              style={{ background: `linear-gradient(120deg, ${theme!.from}, ${theme!.to})` }}
            >
              <span aria-hidden="true">{story.sectionEmoji}</span>
              {story.sectionName}
            </span>
          ) : (
            <span className="text-sm font-bold text-white/80">Brieflet</span>
          )}
          <span className="text-xs font-semibold tabular-nums text-white/70">{story ? `${index + 1}/${stories.length}` : ""}</span>
          <div className="ml-auto flex gap-1">
            {story && (
              <button type="button" onClick={share} className="grid size-10 place-items-center rounded-full bg-black/30 text-white backdrop-blur hover:bg-black/50" aria-label="Share story">
                <Share2 className="size-5" />
              </button>
            )}
            <button type="button" onClick={onClose} className="grid size-10 place-items-center rounded-full bg-black/30 text-white backdrop-blur hover:bg-black/50" aria-label="Close story mode">
              <X className="size-5" />
            </button>
          </div>
        </div>

        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <motion.div
            key={story ? story.id : "end"}
            custom={dir}
            variants={swipeVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            drag
            dragDirectionLock
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.5}
            onDragEnd={onDragEnd}
            className="absolute inset-0 touch-none select-none"
          >
            {story ? (
              <StorySlide story={story} index={index} onPrev={() => go(-1)} onNext={() => go(1)} />
            ) : (
              <EndScreen read={seen.current.size} total={stories.length} next={next} onRestart={() => setState([0, -1])} onClose={onClose} />
            )}
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="absolute bottom-28 left-1/2 z-30 -translate-x-1/2 rounded-full bg-white px-4 py-2 text-sm font-bold text-black shadow-lg"
            >
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function StorySlide({ story, index, onPrev, onNext }: { story: StoryData; index: number; onPrev: () => void; onNext: () => void }) {
  const theme = sectionTheme(story.sectionKey, story.sectionName);
  return (
    <div className="on-dark relative flex h-full flex-col text-white" style={{ ["--accent" as string]: theme.to }}>
      {/* Tap zones: left quarter goes back, right half goes forward (Instagram-style) */}
      <button type="button" aria-label="Previous story" onClick={onPrev} className="absolute inset-y-0 left-0 z-10 w-1/4" tabIndex={-1} />
      <button type="button" aria-label="Next story" onClick={onNext} className="absolute inset-y-0 right-0 z-10 w-1/2" tabIndex={-1} />
      <Cover
        imageUrl={story.imageUrl}
        sectionKey={story.sectionKey}
        sectionName={story.sectionName}
        tag={story.tag}
        headline={story.headline}
        index={story.indexInSection}
        illo={story.illo}
        priority
        sizes="440px"
        className="h-[44%] shrink-0"
      >
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#0b0b10] via-[#0b0b10]/60 to-transparent" />
        <div className="absolute bottom-3 left-5 flex flex-wrap gap-2">
          <TagPill tag={story.tag} />
          <SentimentChip sentiment={story.sentiment} />
          <DifficultyBadge difficulty={story.difficulty} />
        </div>
      </Cover>

      <div className="relative flex min-h-0 flex-1 flex-col px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
        <SourceLine url={story.url} sourceName={story.sourceName} readMinutes={story.readMinutes} className="text-white/60" />
        <h2 className="mt-2 font-display text-[28px] font-extrabold leading-[1.08] tracking-tight text-balance sm:text-[30px]">
          {story.headline}
        </h2>
        <p className="mt-3 text-[17px] leading-relaxed text-white/85">
          <RichText text={story.summary} />
        </p>
        <div
          className="mt-4 rounded-2xl border-l-4 bg-white/[0.07] px-4 py-3 text-[15px] leading-snug"
          style={{ borderColor: theme.to }}
        >
          <div className="mb-1 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider" style={{ color: theme.to }}>
            <Lightbulb className="size-3.5" /> Why it matters
          </div>
          <RichText text={story.whyItMatters} />
        </div>

        <div className="relative z-20 mt-auto pt-4">
          <a
            href={story.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-13 items-center justify-center gap-2 rounded-full bg-white text-base font-bold text-black transition hover:scale-[1.02] active:scale-[0.98]"
          >
            Read the full article <ArrowRight className="size-5" />
          </a>
          <p className="mt-2 text-center text-xs text-white/40">{index === 0 ? "Tap or swipe → for the next story" : " "}</p>
        </div>
      </div>
    </div>
  );
}

function EndScreen({
  read,
  total,
  next,
  onRestart,
  onClose,
}: {
  read: number;
  total: number;
  next?: { href: string; label: string } | null;
  onRestart: () => void;
  onClose: () => void;
}) {
  const streak = useStreak();
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    import("canvas-confetti").then(({ default: confetti }) => {
      if (cancelled) return;
      const colors = ["#7C3AED", "#3B82F6", "#F43F5E", "#F59E0B", "#10B981", "#F2C811"];
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors, zIndex: 60 });
      setTimeout(() => !cancelled && confetti({ particleCount: 60, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors, zIndex: 60 }), 250);
      setTimeout(() => !cancelled && confetti({ particleCount: 60, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors, zIndex: 60 }), 400);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex h-full flex-col items-center justify-center px-8 text-center text-white">
      <motion.div
        initial={{ scale: 0.4, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 12 }}
        className="text-7xl"
      >
        🎉
      </motion.div>
      <h2 className="mt-6 font-display text-4xl font-extrabold tracking-tight">You&apos;re all caught up</h2>
      <p className="mt-3 text-lg text-white/75">
        You read <strong className="text-white">{read}</strong> of {total} {total === 1 ? "story" : "stories"}.
      </p>
      {streak && streak.current > 0 && (
        <motion.div
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-orange-500/15 px-5 py-2.5 text-lg font-extrabold text-orange-300"
        >
          🔥 {streak.current}-day streak{streak.current >= streak.best && streak.current > 1 ? " · personal best!" : ""}
        </motion.div>
      )}
      <div className="mt-10 flex w-full max-w-xs flex-col gap-3">
        {next && (
          <Link href={next.href} onClick={onClose} className="flex h-13 items-center justify-center gap-2 rounded-full bg-white font-bold text-black">
            {next.label} <ArrowRight className="size-5" />
          </Link>
        )}
        <button
          type="button"
          onClick={onClose}
          className={cn("flex h-13 items-center justify-center rounded-full font-bold", next ? "bg-white/10 text-white" : "bg-white text-black")}
        >
          Back to the feed
        </button>
        <button type="button" onClick={onRestart} className="flex h-11 items-center justify-center gap-2 text-sm font-semibold text-white/60 hover:text-white">
          <RotateCcw className="size-4" /> Start over
        </button>
      </div>
    </div>
  );
}
