const WORDS_PER_MINUTE = 230;
const MAX_HTML_BYTES = 1_500_000;

export type PageMeta = { ogImage: string | null; readMinutes: number | null };

/**
 * Fetches an article and extracts its og:image and an estimated read time.
 * Never throws: any failure (timeout, paywall, bad HTML) returns nulls.
 */
export async function fetchPageMeta(url: string, timeoutMs = 4000): Promise<PageMeta> {
  try {
    if (!isPublicHttpUrl(url)) return { ogImage: null, readMinutes: null };
    const res = await fetch(url, {
      signal: AbortSignal.timeout(timeoutMs),
      redirect: "follow",
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; BriefletBot/1.0; +https://github.com/brieflet)",
        accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok || !(res.headers.get("content-type") ?? "").includes("html")) {
      return { ogImage: null, readMinutes: null };
    }
    const html = await readCapped(res, MAX_HTML_BYTES);
    return { ogImage: extractOgImage(html, res.url || url), readMinutes: estimateReadMinutes(html) };
  } catch {
    return { ogImage: null, readMinutes: null };
  }
}

/** Cheap SSRF guard: refuse obvious internal hosts. */
export function isPublicHttpUrl(raw: string): boolean {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return false;
  const h = u.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".internal") || h.endsWith(".local")) return false;
  if (/^(127\.|10\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h)) return false;
  if (h.includes(":")) return !(h === "::1" || h === "::" || /^(fc|fd|fe80)/.test(h) || h.startsWith("::ffff:"));
  return true;
}

async function readCapped(res: Response, cap: number): Promise<string> {
  if (!res.body) return "";
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let out = "";
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    out += decoder.decode(value, { stream: true });
    if (total >= cap) {
      await reader.cancel();
      break;
    }
  }
  return out;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export function extractOgImage(html: string, baseUrl: string): string | null {
  const metas = html.match(/<meta\b[^>]*>/gi) ?? [];
  const wanted = ["og:image:secure_url", "og:image", "og:image:url", "twitter:image", "twitter:image:src"];
  const found = new Map<string, string>();
  for (const tag of metas) {
    const key = /\b(?:property|name)\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1]?.toLowerCase();
    const content = /\bcontent\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1];
    if (key && content && wanted.includes(key) && !found.has(key)) found.set(key, content);
  }
  for (const key of wanted) {
    const raw = found.get(key);
    if (!raw) continue;
    try {
      const abs = new URL(decodeEntities(raw.trim()), baseUrl);
      if (abs.protocol === "http:") abs.protocol = "https:";
      if (abs.protocol === "https:") return abs.toString();
    } catch {
      /* try next */
    }
  }
  return null;
}

export function estimateReadMinutes(html: string): number | null {
  const body =
    /<article\b[\s\S]*?<\/article>/i.exec(html)?.[0] ?? /<body\b[\s\S]*<\/body>/i.exec(html)?.[0] ?? html;
  const text = body
    .replace(/<(script|style|noscript|svg|nav|footer|header|aside)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ");
  const words = text.split(/\s+/).filter((w) => /[a-z]/i.test(w)).length;
  if (words < 120) return null; // paywall / JS-rendered page: not a useful estimate
  return Math.min(30, Math.max(1, Math.round(words / WORDS_PER_MINUTE)));
}

/** Fallback when the article couldn't be fetched: a typical news piece is 3–5 minutes. */
export function guessReadMinutes(summary: string): number {
  return Math.min(6, Math.max(2, Math.round(summary.length / 70)));
}

/** Run async tasks with bounded concurrency. */
export async function mapLimit<T, R>(list: T[], limit: number, fn: (t: T, i: number) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(list.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, list.length) }, async () => {
    while (next < list.length) {
      const i = next++;
      out[i] = await fn(list[i], i);
    }
  });
  await Promise.all(workers);
  return out;
}
