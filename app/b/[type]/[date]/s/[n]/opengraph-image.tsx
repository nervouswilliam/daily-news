import { ImageResponse } from "next/og";
import { getBrief } from "@/lib/briefs/queries";
import { briefTypeSchema } from "@/lib/briefs/schema";
import { toStories } from "@/lib/story";
import { storyArt } from "@/lib/theme";
import { OG_SIZE, OgIllustration, ogFonts } from "@/lib/og";
import { plain } from "@/lib/utils";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Brieflet story";

export default async function Image({ params }: { params: Promise<{ type: string; date: string; n: string }> }) {
  const p = await params;
  const type = briefTypeSchema.safeParse(p.type);
  const brief = type.success ? await getBrief(type.data, p.date) : null;
  const story = brief ? toStories(brief)[Number(p.n) - 1] : undefined;

  const headline = story?.headline ?? "Brieflet";
  const art = storyArt({
    key: story?.sectionKey ?? "ai",
    name: story?.sectionName,
    tag: story?.tag ?? "",
    headline,
    index: story?.indexInSection,
    illo: story?.illo,
  });
  const fonts = await ogFonts(`${headline}${story?.whyItMatters ?? ""}${story?.sourceName ?? ""}${story?.tag ?? ""}${story?.sectionName ?? ""}`);
  const sentiment = story?.sentiment === "up" ? "▲ Up" : story?.sentiment === "down" ? "▼ Down" : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: `linear-gradient(${art.angle}deg, ${art.theme.from}, ${art.theme.to})`,
          padding: 64,
          color: "white",
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        <OgIllustration name={art.illo} size={440} style={{ position: "absolute", right: -30, bottom: -60, opacity: 0.85, transform: "rotate(-8deg)" }} />
        <div style={{ display: "flex", gap: 14, alignItems: "center", fontSize: 26, fontWeight: 700 }}>
          {story && <span style={{ display: "flex" }}>{`${story.sectionEmoji} ${story.sectionName}`}</span>}
          {story && (
            <span style={{ display: "flex", background: "white", color: "#111", borderRadius: 999, padding: "6px 18px", fontSize: 22 }}>{story.tag}</span>
          )}
          {sentiment && (
            <span style={{ display: "flex", background: story?.sentiment === "up" ? "#10B981" : "#F43F5E", borderRadius: 999, padding: "6px 16px", fontSize: 22 }}>
              {sentiment}
            </span>
          )}
        </div>
        <div style={{ display: "flex", fontFamily: fonts ? "Bricolage" : "sans-serif", fontSize: 72, fontWeight: 800, lineHeight: 1.04, marginTop: 40, width: "80%", letterSpacing: -2 }}>
          {headline}
        </div>
        {story && (
          <div style={{ display: "flex", fontSize: 28, marginTop: 28, width: "68%", lineHeight: 1.35, opacity: 0.9 }}>
            {`💡 ${plain(story.whyItMatters)}`}
          </div>
        )}
        <div style={{ display: "flex", marginTop: "auto", fontSize: 24, fontWeight: 700, opacity: 0.85 }}>
          {story ? `${story.sourceName} · via Brieflet` : "Brieflet"}
        </div>
      </div>
    ),
    { ...size, fonts, emoji: "twemoji" },
  );
}
