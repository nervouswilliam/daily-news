import { ImageResponse } from "next/og";
import { getBrief } from "@/lib/briefs/queries";
import { briefTypeSchema } from "@/lib/briefs/schema";
import { BRIEF_TYPE_META, MOOD_META, sectionTheme } from "@/lib/theme";
import { OG_SIZE, OgIllustration, ogFonts } from "@/lib/og";
import { formatBriefDate, plain } from "@/lib/utils";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Brieflet daily brief";

export default async function Image({ params }: { params: Promise<{ type: string; date: string }> }) {
  const p = await params;
  const type = briefTypeSchema.safeParse(p.type);
  const brief = type.success ? await getBrief(type.data, p.date) : null;

  const title = brief?.title ?? "Brieflet";
  const meta = brief ? BRIEF_TYPE_META[brief.briefType] : BRIEF_TYPE_META["daily-news"];
  const mood = brief ? MOOD_META[brief.mood] : null;
  const themes = (brief?.sections ?? []).map((s) => sectionTheme(s.key, s.name));
  const t0 = themes[0] ?? sectionTheme("ai");
  const t1 = themes[1] ?? t0;
  const bullets = (brief?.tldr ?? []).slice(0, 3).map(plain);
  const dateLabel = brief ? formatBriefDate(brief.date) : "";
  const fonts = await ogFonts(`${title}${bullets.join("")}${dateLabel}`);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: `linear-gradient(130deg, ${t0.from}, ${t0.to} 55%, ${t1.to})`,
          padding: 64,
          color: "white",
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        <OgIllustration name={t0.illos[0]} size={420} style={{ position: "absolute", right: -40, bottom: -70, opacity: 0.9, transform: "rotate(-10deg)" }} />
        <div style={{ display: "flex", flexDirection: "column", width: "78%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 28, fontWeight: 700, opacity: 0.9 }}>
            <span>{`Brieflet · ${meta.label}`}</span>
            {mood && (
              <span style={{ display: "flex", background: "rgba(255,255,255,.2)", borderRadius: 999, padding: "6px 18px", fontSize: 24 }}>
                {`${mood.emoji} ${mood.label}`}
              </span>
            )}
          </div>
          <div style={{ fontSize: 26, marginTop: 8, opacity: 0.8 }}>{dateLabel}</div>
          <div style={{ fontFamily: fonts ? "Bricolage" : "sans-serif", fontSize: title.length > 60 ? 58 : 68, fontWeight: 800, lineHeight: 1.05, marginTop: 28, letterSpacing: -1.5 }}>
            {title}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 30 }}>
            {bullets.slice(0, 2).map((b, i) => (
              <div key={i} style={{ display: "flex", gap: 14, fontSize: 24, lineHeight: 1.3, opacity: 0.92 }}>
                <span style={{ fontWeight: 800 }}>{i + 1}</span>
                <span style={{ display: "flex" }}>{b.length > 110 ? `${b.slice(0, 108)}…` : b}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size, fonts, emoji: "twemoji" },
  );
}
