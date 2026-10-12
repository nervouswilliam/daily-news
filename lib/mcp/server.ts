import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { briefInputSchema, briefTypeSchema, formatZodError } from "@/lib/briefs/schema";
import { saveBrief } from "@/lib/briefs/save";
import { listRecentUrls } from "@/lib/briefs/queries";
import { briefPath } from "@/lib/site";

const text = (t: string, isError = false) => ({ content: [{ type: "text" as const, text: t }], isError });

export function buildMcpHandler(baseUrl: string) {
  return createMcpHandler(
    (server) => {
      server.registerTool(
        "save_brief",
        {
          title: "Save brief",
          description:
            "Publish a daily brief to Brieflet. Upserts by (briefType, date): calling again for the same day replaces the earlier version. " +
            "Returns the public URL of the published brief. Include each article's og:image as imageUrl when you know it; " +
            "otherwise Brieflet tries to fetch it, and falls back to an illustration.",
          inputSchema: briefInputSchema,
        },
        async (args) => {
          const parsed = briefInputSchema.safeParse(args);
          if (!parsed.success) return text(`Invalid brief:\n${formatZodError(parsed.error)}`, true);
          try {
            const db = await getDb();
            const res = await saveBrief(db, parsed.data);
            const url = `${baseUrl}${briefPath(parsed.data.briefType, parsed.data.date)}`;
            return text(
              JSON.stringify(
                {
                  ok: true,
                  url,
                  action: res.created ? "created" : "replaced",
                  sections: res.sectionCount,
                  stories: res.itemCount,
                  storiesWithImages: res.imagesFound,
                },
                null,
                2,
              ),
            );
          } catch (err) {
            console.error("[mcp] save_brief failed", err);
            return text(`Failed to save brief: ${(err as Error).message}`, true);
          }
        },
      );

      server.registerTool(
        "list_recent_urls",
        {
          title: "List recent story URLs",
          description:
            "Returns the article URLs (with headlines and dates) saved in the last N days (default 7) for a brief type. " +
            "Call this before researching so you can skip stories that were already covered.",
          inputSchema: z.object({
            briefType: briefTypeSchema,
            days: z.number().int().min(1).max(60).optional().describe("Look-back window in days (default 7)"),
          }),
          annotations: { readOnlyHint: true },
        },
        async ({ briefType, days }) => {
          const db = await getDb();
          const res = await listRecentUrls(db, briefType, days ?? 7);
          return text(
            JSON.stringify(
              { briefType, since: res.since, count: res.items.length, urls: res.items.map((i) => i.url), items: res.items },
              null,
              2,
            ),
          );
        },
      );
    },
    { serverInfo: { name: "brieflet", version: "1.0.0" } },
  );
}
