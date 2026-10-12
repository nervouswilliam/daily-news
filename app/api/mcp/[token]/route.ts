import { isValidSecret } from "@/lib/auth";
import { buildMcpHandler } from "@/lib/mcp/server";
import { siteUrl } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Ctx = { params: Promise<{ token: string }> };

async function handle(req: Request, { params }: Ctx) {
  const { token } = await params;
  // 404 (not 401) so the endpoint's existence isn't advertised to scanners.
  if (!isValidSecret(decodeURIComponent(token))) return new Response("Not found", { status: 404 });
  return buildMcpHandler(siteUrl(req))(req);
}

export { handle as GET, handle as POST, handle as DELETE };
