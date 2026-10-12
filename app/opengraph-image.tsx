import { ImageResponse } from "next/og";
import { OG_SIZE, OgIllustration, ogFonts } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Brieflet: your day in 60 seconds";

export default async function Image() {
  const fonts = await ogFonts("BriefletYour day in 60 seconds.");
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          color: "white",
          position: "relative",
          background: "linear-gradient(130deg, #7C3AED, #F43F5E 60%, #F59E0B)",
        }}
      >
        <OgIllustration name="spark" size={420} style={{ position: "absolute", right: 40, top: 100, opacity: 0.9 }} />
        <div style={{ fontFamily: fonts ? "Bricolage" : "sans-serif", fontSize: 120, fontWeight: 800, letterSpacing: -4 }}>Brieflet</div>
        <div style={{ fontFamily: fonts ? "Bricolage" : "sans-serif", fontSize: 52, fontWeight: 800, opacity: 0.9 }}>Your day in 60 seconds.</div>
      </div>
    ),
    { ...size, fonts },
  );
}
