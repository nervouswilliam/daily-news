import type { BriefFull } from "@/lib/briefs/queries";
import type { BriefType } from "@/lib/briefs/schema";
import type { IllustrationName } from "@/components/illustrations";
import { assignIllustrations } from "@/lib/theme";

/** Serializable story shape passed to client components. */
export type StoryData = {
  id: number;
  n: number; // 1-based position in the brief (used in share URLs)
  headline: string;
  summary: string;
  whyItMatters: string;
  url: string;
  sourceName: string;
  imageUrl: string | null;
  tag: string;
  sentiment: "up" | "down" | "neutral" | null;
  difficulty: "beginner" | "intermediate" | "advanced" | null;
  readMinutes: number | null;
  sectionKey: string;
  sectionName: string;
  sectionEmoji: string;
  indexInSection: number;
  /** Fallback illustration, unique within its section. */
  illo: IllustrationName;
};

export type BriefMeta = {
  id: number;
  briefType: BriefType;
  date: string;
  title: string;
};

export function toStories(brief: BriefFull): StoryData[] {
  let n = 0;
  return brief.sections.flatMap((s) => {
    const illos = assignIllustrations(s.key, s.name, s.items.map((it) => it.tag));
    return s.items.map((it, i) => ({
      id: it.id,
      n: ++n,
      headline: it.headline,
      summary: it.summary,
      whyItMatters: it.whyItMatters,
      url: it.url,
      sourceName: it.sourceName,
      imageUrl: it.imageUrl,
      tag: it.tag,
      sentiment: it.sentiment,
      difficulty: it.difficulty,
      readMinutes: it.readMinutes,
      sectionKey: s.key,
      sectionName: s.name,
      sectionEmoji: s.emoji,
      indexInSection: i,
      illo: illos[i],
    }));
  });
}

export const briefMeta = (b: BriefFull): BriefMeta => ({ id: b.id, briefType: b.briefType, date: b.date, title: b.title });
