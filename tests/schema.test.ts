import { describe, expect, it } from "vitest";
import { briefInputSchema } from "@/lib/briefs/schema";
import { validBrief } from "./helpers";

const item = () => structuredClone(validBrief().sections[0].items[0]);

describe("briefInputSchema", () => {
  it("accepts a valid brief", () => {
    expect(briefInputSchema.safeParse(validBrief()).success).toBe(true);
  });

  it("normalises ISO datetimes to a Singapore calendar date", () => {
    // 20:00 UTC on the 11th is 04:00 on the 12th in Singapore
    const r = briefInputSchema.parse(validBrief({ date: "2026-10-11T20:00:00Z" }));
    expect(r.date).toBe("2026-10-12");
  });

  it("slugifies section keys", () => {
    const b = validBrief();
    b.sections[0].key = "US Finance";
    expect(briefInputSchema.parse(b).sections[0].key).toBe("us-finance");
  });

  it.each([
    ["unknown briefType", { briefType: "sports" }],
    ["bad mood", { mood: "sleepy" }],
    ["bad date", { date: "yesterday" }],
    ["two tldr bullets", { tldr: ["a thing", "b thing"] }],
    ["no sections", { sections: [] }],
  ])("rejects %s", (_label, override) => {
    expect(briefInputSchema.safeParse(validBrief(override as never)).success).toBe(false);
  });

  it("rejects headlines longer than 12 words", () => {
    const b = validBrief();
    b.sections[0].items[0].headline = "one two three four five six seven eight nine ten eleven twelve thirteen";
    const r = briefInputSchema.safeParse(b);
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toMatch(/12 words/);
  });

  it("rejects non-http item URLs and non-https image URLs", () => {
    const b1 = validBrief();
    b1.sections[0].items[0].url = "javascript:alert(1)";
    expect(briefInputSchema.safeParse(b1).success).toBe(false);

    const b2 = validBrief();
    b2.sections[0].items[0].imageUrl = "http://insecure.example.com/x.jpg";
    expect(briefInputSchema.safeParse(b2).success).toBe(false);
  });

  it("validates sentiment and difficulty enums", () => {
    const b = validBrief();
    b.sections[0].items[0] = { ...item(), sentiment: "up", difficulty: "advanced" };
    expect(briefInputSchema.safeParse(b).success).toBe(true);
    b.sections[0].items[0] = { ...item(), sentiment: "sideways" as never };
    expect(briefInputSchema.safeParse(b).success).toBe(false);
  });

  it("rejects duplicate section keys", () => {
    const b = validBrief();
    b.sections.push(structuredClone(b.sections[0]));
    const r = briefInputSchema.safeParse(b);
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toMatch(/duplicate/);
  });
});
