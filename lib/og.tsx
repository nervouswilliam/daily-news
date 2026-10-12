import { ILLUSTRATIONS, type IllustrationName } from "@/components/illustrations";

export const OG_SIZE = { width: 1200, height: 630 };

/** Load Bricolage Grotesque for OG images; falls back to the default font if Google Fonts is unreachable. */
export async function ogFonts(extra: string) {
  // Subset to printable ASCII plus any extra characters, so every line renders in the same face.
  const ascii = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join("");
  const text = [...new Set(ascii + extra + "·…’“”—–▲▼")].join("");
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@800&text=${encodeURIComponent(text)}`,
      { signal: AbortSignal.timeout(3000) },
    ).then((r) => r.text());
    const src = /src: url\((.+?)\) format\('(opentype|truetype)'\)/.exec(css)?.[1];
    if (!src) return undefined;
    const data = await fetch(src, { signal: AbortSignal.timeout(3000) }).then((r) => r.arrayBuffer());
    return [{ name: "Bricolage", data, weight: 800 as const, style: "normal" as const }];
  } catch {
    return undefined;
  }
}

/** SVG illustration usable inside ImageResponse (avoid ones that rely on <text>). */
export function OgIllustration({ name, size, style }: { name: IllustrationName; size: number; style?: React.CSSProperties }) {
  const safe: IllustrationName = name === "coins" || name === "fx" ? "spark" : name;
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} style={{ color: "white", ...style }}>
      {ILLUSTRATIONS[safe]}
    </svg>
  );
}
