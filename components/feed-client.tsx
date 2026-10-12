"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useStreak } from "@/components/chrome";
import { getReadIds, markRead, onReadingChange } from "@/lib/reading";
import { sectionTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

/** Marks a story as read once its card has been mostly on screen for a moment. */
export function SeenTracker({ briefId, itemId, children }: { briefId: number; itemId: number; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) timer = setTimeout(() => markRead(briefId, itemId), 1200);
        else clearTimeout(timer);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      clearTimeout(timer);
      io.disconnect();
    };
  }, [briefId, itemId]);
  return <div ref={ref}>{children}</div>;
}

type Chip = { key: string; name: string; emoji: string; count: number };

/** Sticky section chips with scroll-spy. */
export function SectionChips({ sections }: { sections: Chip[] }) {
  const [active, setActive] = useState(sections[0]?.key);
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const els = sections.map((s) => document.getElementById(`sec-${s.key}`)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id.slice(4));
      },
      { rootMargin: "-130px 0px -55% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [sections]);

  useEffect(() => {
    rowRef.current?.querySelector<HTMLElement>(`[data-key="${active}"]`)?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [active]);

  return (
    <div className="sticky top-14 z-20 -mx-4 border-b border-line/60 bg-paper/85 px-4 py-2.5 backdrop-blur-xl">
      <div ref={rowRef} className="no-scrollbar flex gap-2 overflow-x-auto">
        {sections.map((s) => {
          const t = sectionTheme(s.key, s.name);
          const on = s.key === active;
          return (
            <a
              key={s.key}
              data-key={s.key}
              href={`#sec-${s.key}`}
              onClick={() => setActive(s.key)}
              className={cn(
                "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-bold transition",
                on ? "text-white shadow-md" : "bg-surface text-ink ring-1 ring-line hover:bg-surface-2",
              )}
              style={on ? { background: `linear-gradient(120deg, ${t.from}, ${t.to})` } : undefined}
            >
              <span aria-hidden="true">{s.emoji}</span>
              {s.name}
              <span className={cn("text-xs tabular-nums", on ? "text-white/80" : "text-muted")}>{s.count}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

/** End-of-feed celebration. */
export function CaughtUp({
  briefId,
  itemIds,
  next,
}: {
  briefId: number;
  itemIds: number[];
  next?: { href: string; label: string } | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [read, setRead] = useState(0);
  const streak = useStreak();

  useEffect(() => {
    const update = () => {
      const ids = getReadIds(briefId);
      setRead(itemIds.filter((id) => ids.has(id)).length);
    };
    update();
    return onReadingChange(update);
  }, [briefId, itemIds]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const key = `brieflet:confetti:${briefId}`;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        try {
          if (sessionStorage.getItem(key)) return;
          sessionStorage.setItem(key, "1");
        } catch {}
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        import("canvas-confetti").then(({ default: confetti }) =>
          confetti({ particleCount: 90, spread: 75, origin: { y: 0.8 }, colors: ["#7C3AED", "#3B82F6", "#F43F5E", "#F59E0B", "#10B981"] }),
        );
      },
      { threshold: 0.7 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [briefId]);

  return (
    <div ref={ref} className="mt-10 rounded-[28px] bg-surface p-8 text-center ring-1 ring-line">
      <div className="text-6xl">🎉</div>
      <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight">You&apos;re all caught up</h2>
      <p className="mt-2 text-lg text-muted">
        You&apos;ve read <strong className="text-ink">{read}</strong> of {itemIds.length} stories.
      </p>
      {streak && streak.current > 0 && (
        <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-orange-500/12 px-4 py-2 font-bold text-orange-600 dark:text-orange-400">
          🔥 {streak.current}-day reading streak
        </p>
      )}
      <div className="mt-6 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
        {next && (
          <Link href={next.href} className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 font-bold text-paper">
            {next.label} <ArrowRight className="size-4" />
          </Link>
        )}
        <Link href="/archive" className="inline-flex h-12 items-center rounded-full px-6 font-bold text-muted hover:text-ink">
          Browse the archive
        </Link>
      </div>
    </div>
  );
}
