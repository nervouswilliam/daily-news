import { MOOD_META } from "@/lib/theme";
import { cn, faviconUrl } from "@/lib/utils";
import type { Mood } from "@/lib/briefs/schema";

export function TagPill({ tag, className }: { tag: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold tracking-wide text-neutral-900 shadow-sm backdrop-blur",
        className,
      )}
    >
      {tag}
    </span>
  );
}

export function SentimentChip({ sentiment, className }: { sentiment: "up" | "down" | "neutral" | null; className?: string }) {
  if (!sentiment) return null;
  const map = {
    up: { glyph: "▲", label: "Up", cls: "bg-emerald-500 text-white" },
    down: { glyph: "▼", label: "Down", cls: "bg-rose-500 text-white" },
    neutral: { glyph: "◆", label: "Flat", cls: "bg-neutral-800/80 text-white" },
  }[sentiment];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-extrabold shadow-sm", map.cls, className)}>
      <span aria-hidden="true">{map.glyph}</span>
      {map.label}
    </span>
  );
}

export function DifficultyBadge({ difficulty, className }: { difficulty: "beginner" | "intermediate" | "advanced" | null; className?: string }) {
  if (!difficulty) return null;
  const map = {
    beginner: { dots: 1, label: "Beginner", cls: "bg-emerald-400 text-emerald-950" },
    intermediate: { dots: 2, label: "Intermediate", cls: "bg-amber-300 text-amber-950" },
    advanced: { dots: 3, label: "Advanced", cls: "bg-rose-400 text-rose-950" },
  }[difficulty];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold shadow-sm", map.cls, className)}>
      <span className="flex gap-0.5" aria-hidden="true">
        {[1, 2, 3].map((d) => (
          <span key={d} className={cn("size-1.5 rounded-full bg-current", d > map.dots && "opacity-25")} />
        ))}
      </span>
      {map.label}
    </span>
  );
}

export function SourceLine({
  url,
  sourceName,
  readMinutes,
  className,
}: {
  url: string;
  sourceName: string;
  readMinutes: number | null;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2 text-[13px] font-medium text-muted", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={faviconUrl(url)} alt="" width={16} height={16} className="size-4 rounded-sm bg-white" loading="lazy" />
      <span className="truncate font-semibold">{sourceName}</span>
      {readMinutes ? (
        <>
          <span aria-hidden="true">·</span>
          <span className="shrink-0">{readMinutes} min read</span>
        </>
      ) : null}
    </div>
  );
}

export function MoodBadge({ mood, className }: { mood: Mood; className?: string }) {
  const m = MOOD_META[mood];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold text-white shadow-sm",
        mood === "wild" && "mood-wild",
        className,
      )}
      style={{
        background:
          mood === "wild"
            ? `linear-gradient(90deg, ${m.color}, #EC4899, #F59E0B, ${m.color})`
            : `linear-gradient(135deg, ${m.color}, color-mix(in oklab, ${m.color} 70%, black))`,
      }}
    >
      <span aria-hidden="true">{m.emoji}</span>
      {m.label}
    </span>
  );
}
