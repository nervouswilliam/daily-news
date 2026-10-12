import { NextResponse } from "next/server";
import { bearerToken, isValidSecret } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { briefInputSchema } from "@/lib/briefs/schema";
import { saveBrief } from "@/lib/briefs/save";
import { briefPath, siteUrl } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  if (!isValidSecret(bearerToken(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: { "www-authenticate": "Bearer" } });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "body must be JSON" }, { status: 400 });
  }
  const parsed = briefInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_failed", issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) },
      { status: 422 },
    );
  }
  const db = await getDb();
  const res = await saveBrief(db, parsed.data);
  const url = `${siteUrl(req)}${briefPath(parsed.data.briefType, parsed.data.date)}`;
  return NextResponse.json({ ok: true, url, action: res.created ? "created" : "replaced", ...res }, { status: res.created ? 201 : 200 });
}
