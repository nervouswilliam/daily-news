import { z } from "zod";

export const BRIEF_TYPES = ["daily-news", "powerbi"] as const;
export const MOODS = ["calm", "busy", "tense", "wild"] as const;

export const briefTypeSchema = z.enum(BRIEF_TYPES);
export type BriefType = z.infer<typeof briefTypeSchema>;
export type Mood = (typeof MOODS)[number];

const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

/** Accepts "2026-10-12" or any ISO datetime; normalises to a YYYY-MM-DD date in Singapore time. */
export const briefDateSchema = z
  .string()
  .trim()
  .refine((s) => /^\d{4}-\d{2}-\d{2}$/.test(s) || !Number.isNaN(Date.parse(s)), {
    message: "date must be an ISO date (YYYY-MM-DD) or ISO datetime",
  })
  .transform((s) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    return toSgtDate(new Date(s));
  })
  .refine((s) => !Number.isNaN(Date.parse(`${s}T00:00:00Z`)), { message: "date is not a real calendar date" });

export function toSgtDate(d: Date): string {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Singapore",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

const httpsUrl = z
  .string()
  .trim()
  .url()
  .refine((u) => /^https?:\/\//i.test(u), { message: "must be an http(s) URL" });

export const itemSchema = z.object({
  headline: z
    .string()
    .trim()
    .min(3)
    .max(120)
    .refine((s) => wordCount(s) <= 12, { message: "headline must be 12 words or fewer" })
    .describe("Punchy headline, 12 words max"),
  summary: z.string().trim().min(10).max(420).describe("1–2 sentences. Wrap 1 key phrase in **bold**."),
  whyItMatters: z.string().trim().min(5).max(300).describe("One sentence: why the reader should care"),
  url: httpsUrl.describe("Link to the original article"),
  sourceName: z.string().trim().min(1).max(80).describe('Publication name, e.g. "Reuters"'),
  imageUrl: z
    .string()
    .trim()
    .url()
    .refine((u) => u.startsWith("https://"), { message: "imageUrl must be https" })
    .optional()
    .nullable()
    .describe("The article's og:image URL if known"),
  tag: z.string().trim().min(1).max(32).describe('Short label, e.g. "Model release", "Tariffs", "DAX tip"'),
  sentiment: z.enum(["up", "down", "neutral"]).optional().nullable().describe("Finance items only"),
  difficulty: z
    .enum(["beginner", "intermediate", "advanced"])
    .optional()
    .nullable()
    .describe("Power BI items only"),
});

export const sectionSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1)
    .max(40)
    .transform((s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""))
    .describe('Stable slug, e.g. "ai", "us-finance", "asia-finance", "geopolitics", "report-design", "data-modeling", "solutions", "updates"'),
  name: z.string().trim().min(1).max(60),
  emoji: z.string().trim().min(1).max(16),
  overview: z.string().trim().min(10).max(900).describe("2–4 conversational sentences"),
  items: z.array(itemSchema).min(1).max(8),
});

export const briefInputSchema = z
  .object({
    briefType: briefTypeSchema,
    date: briefDateSchema.describe("The brief's date, YYYY-MM-DD (Singapore time)"),
    title: z.string().trim().min(1).max(140),
    tldr: z
      .array(z.string().trim().min(3).max(240))
      .length(3, { message: "tldr must have exactly 3 bullets" })
      .describe('The "60-second version": exactly 3 bullets'),
    mood: z.enum(MOODS).describe("Overall vibe of the day"),
    sections: z.array(sectionSchema).min(1).max(8),
  })
  .superRefine((b, ctx) => {
    const seen = new Set<string>();
    b.sections.forEach((s, i) => {
      if (seen.has(s.key)) {
        ctx.addIssue({ code: "custom", path: ["sections", i, "key"], message: `duplicate section key "${s.key}"` });
      }
      seen.add(s.key);
    });
  });

export type BriefInput = z.output<typeof briefInputSchema>;
export type BriefInputRaw = z.input<typeof briefInputSchema>;
export type ItemInput = z.output<typeof itemSchema>;

export function formatZodError(err: z.ZodError): string {
  return err.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`).join("\n");
}
