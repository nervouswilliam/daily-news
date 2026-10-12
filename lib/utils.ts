import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Small deterministic string hash (FNV-1a) for picking illustrations / gradients. */
export function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function faviconUrl(url: string): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname(url))}&sz=64`;
}

export function formatBriefDate(date: string, opts: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" }) {
  return new Intl.DateTimeFormat("en-SG", { ...opts, timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}

/** Strip **bold** markers for plain-text contexts (meta tags, OG images). */
export const plain = (s: string) => s.replace(/\*\*(.+?)\*\*/g, "$1");
