import type { BriefType } from "@/lib/briefs/schema";

export function siteUrl(req?: Request): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (req) {
    const u = new URL(req.url);
    const proto = req.headers.get("x-forwarded-proto") ?? u.protocol.replace(":", "");
    const host = req.headers.get("x-forwarded-host") ?? u.host;
    return `${proto}://${host}`;
  }
  return "http://localhost:3000";
}

export const briefPath = (type: BriefType, date: string) => `/b/${type}/${date}`;
export const storyPath = (type: BriefType, date: string, n: number) => `/b/${type}/${date}/s/${n}`;

export const BRIEF_TYPE_LABEL: Record<BriefType, string> = {
  "daily-news": "Daily Brief",
  powerbi: "Power BI Brief",
};
