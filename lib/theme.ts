import { hash } from "./utils";
import type { IllustrationName } from "@/components/illustrations";

export type SectionTheme = {
  id: string;
  from: string;
  to: string;
  /** Solid accent used for text highlights, chips, borders. */
  accent: string;
  /** Illustrations this section draws from (header uses the first). */
  illos: IllustrationName[];
};

export const SECTION_THEMES: Record<string, SectionTheme> = {
  ai: { id: "ai", from: "#7C3AED", to: "#3B82F6", accent: "#7C3AED", illos: ["chip", "brain", "network", "robot", "spark"] },
  "us-finance": { id: "us-finance", from: "#059669", to: "#0D9488", accent: "#059669", illos: ["candles", "trend", "bank", "coins"] },
  "asia-finance": { id: "asia-finance", from: "#F43F5E", to: "#F59E0B", accent: "#E11D48", illos: ["coins", "skyline", "candles", "trend"] },
  geopolitics: { id: "geopolitics", from: "#1E3A8A", to: "#475569", accent: "#2563EB", illos: ["globe", "ship", "flags", "oil", "scales"] },
  "report-design": { id: "report-design", from: "#F2C811", to: "#F97316", accent: "#D97706", illos: ["palette", "barchart", "dashboard", "pie"] },
  "data-modeling": { id: "data-modeling", from: "#D97706", to: "#EAB308", accent: "#B45309", illos: ["fx", "schema", "table", "barchart"] },
  solutions: { id: "solutions", from: "#0891B2", to: "#0EA5E9", accent: "#0891B2", illos: ["gear", "branch", "dashboard", "schema"] },
  updates: { id: "updates", from: "#DB2777", to: "#8B5CF6", accent: "#DB2777", illos: ["rocket", "spark", "dashboard", "barchart"] },
};

const EXTRA_THEMES: SectionTheme[] = [
  { id: "x1", from: "#EA580C", to: "#DC2626", accent: "#EA580C", illos: ["spark", "globe", "trend"] },
  { id: "x2", from: "#16A34A", to: "#65A30D", accent: "#16A34A", illos: ["barchart", "spark", "gear"] },
  { id: "x3", from: "#0F766E", to: "#1D4ED8", accent: "#0F766E", illos: ["network", "globe", "spark"] },
];

const KEY_ALIASES: [RegExp, string][] = [
  [/\b(ai|artificial|machine|llm|ml)\b/, "ai"],
  [/(us|america|wall).*(finance|market)|^finance$/, "us-finance"],
  [/(asia|china|japan|singapore|apac).*(finance|market)/, "asia-finance"],
  [/geo|politic|world|trade|war/, "geopolitics"],
  [/design|visual|report/, "report-design"],
  [/model|dax|data/, "data-modeling"],
  [/solution|build|practice|devops/, "solutions"],
  [/update|release|news|feature/, "updates"],
];

export function sectionTheme(key: string, name = ""): SectionTheme {
  if (SECTION_THEMES[key]) return SECTION_THEMES[key];
  const hay = `${key} ${name}`.toLowerCase().replace(/-/g, " ");
  for (const [re, id] of KEY_ALIASES) if (re.test(hay)) return SECTION_THEMES[id];
  return EXTRA_THEMES[hash(key) % EXTRA_THEMES.length];
}

/** Tag keywords that strongly suggest a specific illustration. */
const TAG_ILLOS: [RegExp, IllustrationName][] = [
  [/chip|semi|gpu|hardware/i, "chip"],
  [/model release|llm|open.?weights|research/i, "brain"],
  [/agent|robot|automation/i, "robot"],
  [/regulat|law|court|policy|antitrust/i, "scales"],
  [/tariff|trade|shipping|supply/i, "ship"],
  [/oil|energy|opec|gas/i, "oil"],
  [/iran|israel|russia|ukraine|china|taiwan|sanction|war|election/i, "flags"],
  [/fed|bond|rate|yield|central bank/i, "bank"],
  [/earning|stock|market|equit|ipo/i, "candles"],
  [/currenc|yen|fx|forex|dollar|crypto/i, "coins"],
  [/singapore|hong kong|tokyo|property|real estate/i, "skyline"],
  [/dax|measure|calc/i, "fx"],
  [/model|schema|relationship|star/i, "schema"],
  [/chart|visual|layout|design|colou?r/i, "palette"],
  [/git|devops|pipeline|deploy|version/i, "branch"],
  [/test|perf|optimi/i, "gear"],
  [/feature|preview|ga\b|update|fabric/i, "rocket"],
  [/power query|table|m code/i, "table"],
];

export const tagIllustration = (tag: string) => TAG_ILLOS.find(([re]) => re.test(tag))?.[1];

/**
 * Assign illustrations to a section's stories so no two in the same section repeat:
 * each story gets its tag's illustration if still free, otherwise the next unused one from the section pool.
 */
export function assignIllustrations(key: string, name: string, tags: string[]): IllustrationName[] {
  const pool = sectionTheme(key, name).illos;
  const used = new Set<IllustrationName>();
  const start = hash(key) % pool.length;
  return tags.map((tag, i) => {
    const preferred = tagIllustration(tag);
    let pick = preferred && !used.has(preferred) ? preferred : undefined;
    for (let k = 0; !pick && k < pool.length; k++) {
      const cand = pool[(start + i + k) % pool.length];
      if (!used.has(cand)) pick = cand;
    }
    pick ??= pool[(start + i) % pool.length];
    used.add(pick);
    return pick;
  });
}

/**
 * Pick an illustration + gradient variant for a story. Deterministic per story;
 * the layout variant rotates with the story's position so neighbours look different.
 */
export function storyArt(opts: { key: string; name?: string; tag: string; headline: string; index?: number; illo?: IllustrationName }) {
  const theme = sectionTheme(opts.key, opts.name);
  const h = hash(`${opts.headline}|${opts.tag}`);
  const illo = opts.illo ?? tagIllustration(opts.tag) ?? theme.illos[h % theme.illos.length];
  const variant = opts.index === undefined ? h % 4 : (opts.index + hash(opts.key)) % 4;
  return { theme, illo, variant, angle: 120 + (h % 5) * 20 };
}

export const MOOD_META = {
  calm: { emoji: "🌊", label: "Calm day", color: "#0EA5E9" },
  busy: { emoji: "⚡", label: "Busy day", color: "#F59E0B" },
  tense: { emoji: "🔥", label: "Tense day", color: "#EF4444" },
  wild: { emoji: "🌪️", label: "Wild day", color: "#8B5CF6" },
} as const;

export const BRIEF_TYPE_META = {
  "daily-news": { label: "Daily Brief", short: "Daily", emoji: "🗞️", color: "#7C3AED" },
  powerbi: { label: "Power BI Brief", short: "Power BI", emoji: "📊", color: "#E0B400" },
} as const;
