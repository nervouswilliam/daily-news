import { describe, expect, it } from "vitest";
import { estimateReadMinutes, extractOgImage, isPublicHttpUrl } from "@/lib/briefs/enrich";
import { isValidSecret } from "@/lib/auth";

describe("extractOgImage", () => {
  it("finds og:image regardless of attribute order and resolves relative URLs", () => {
    expect(extractOgImage(`<meta content="/img/a.jpg" property="og:image">`, "https://news.example.com/x")).toBe(
      "https://news.example.com/img/a.jpg",
    );
    expect(
      extractOgImage(`<meta name="twitter:image" content="https://cdn.x.com/b.png?a=1&amp;b=2">`, "https://x.com"),
    ).toBe("https://cdn.x.com/b.png?a=1&b=2");
    expect(extractOgImage("<p>no meta</p>", "https://x.com")).toBeNull();
  });
});

describe("estimateReadMinutes", () => {
  it("estimates from article word count and ignores scripts", () => {
    const words = Array.from({ length: 1150 }, () => "word").join(" ");
    expect(estimateReadMinutes(`<article><script>${words}</script><p>${words}</p></article>`)).toBe(5);
    expect(estimateReadMinutes("<body>tiny</body>")).toBeNull();
  });
});

describe("isPublicHttpUrl", () => {
  it("blocks internal hosts", () => {
    expect(isPublicHttpUrl("https://reuters.com/x")).toBe(true);
    expect(isPublicHttpUrl("https://fcbarcelona.com/x")).toBe(true);
    expect(isPublicHttpUrl("http://localhost:3000")).toBe(false);
    expect(isPublicHttpUrl("http://169.254.169.254/latest")).toBe(false);
    expect(isPublicHttpUrl("http://[::1]/")).toBe(false);
    expect(isPublicHttpUrl("file:///etc/passwd")).toBe(false);
  });
});

describe("isValidSecret", () => {
  it("rejects wrong, missing and weak secrets", () => {
    const secret = "s3cret-s3cret-s3cret";
    expect(isValidSecret(secret, secret)).toBe(true);
    expect(isValidSecret("nope", secret)).toBe(false);
    expect(isValidSecret(secret, undefined)).toBe(false);
    expect(isValidSecret("short", "short")).toBe(false);
  });
});
