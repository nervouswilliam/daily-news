# Brieflet 🗞️

Your daily AI-written news briefs, designed to be read like a social feed: a 60-second TL;DR card, Instagram-style **story mode**, a visual **scroll feed**, streaks, confetti and an archive.

Claude scheduled tasks push briefs in through a **remote MCP server** (`save_brief`, `list_recent_urls`) that you add to claude.ai as a custom connector.

- **Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Motion (Framer Motion) · Drizzle ORM + Postgres (Neon / Vercel Postgres) · `mcp-handler` 2 (MCP SDK v2) · Vitest
- **Local dev needs no database:** with `DATABASE_URL` empty, Brieflet uses an embedded [PGlite](https://pglite.dev) Postgres in `./.pglite`. It migrates and seeds itself on first start.

---

## Quick start (local)

```bash
npm install
cp .env.example .env.local      # then set MCP_SECRET (see below)
npm run dev                     # http://localhost:3000
```

On first start you'll see two sample briefs (Daily Brief and Power BI Brief) dated today.

| Script | What it does |
|---|---|
| `npm run dev` | Dev server (PGlite if no `DATABASE_URL`) |
| `npm test` | Vitest: zod schema, save/upsert, og:image parsing, auth |
| `npm run build` | Runs migrations (if `DATABASE_URL` is set), then `next build` |
| `npm run db:generate` | Generate a new SQL migration after editing `lib/db/schema.ts` |
| `npm run db:migrate` | Apply migrations to `DATABASE_URL` |
| `npm run db:seed` | Insert/replace the two sample briefs (dated today) |

To reset the local DB, stop the dev server and delete the `.pglite/` folder.

## Environment variables

| Name | Required | Description |
|---|---|---|
| `DATABASE_URL` | In production | Postgres connection string (Neon / Vercel Postgres). Empty locally means PGlite. |
| `MCP_SECRET` | Yes | Long random secret. Used in the MCP URL path and as the REST Bearer token. Must be ≥ 16 chars. |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Public origin, e.g. `https://brieflet.vercel.app`. Used for links returned by `save_brief` and OG tags. Falls back to `VERCEL_PROJECT_PRODUCTION_URL`, then the request host. |

Generate a secret:

```bash
node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"
```

## Database

Tables: `briefs` (unique on `brief_type, date`), `sections`, `items`. Migrations live in `drizzle/`.

**Neon (recommended):** create a project at neon.tech, copy the *pooled* connection string into `DATABASE_URL`, then:

```bash
npm run db:migrate
npm run db:seed      # optional sample data
```

## Deploying to Vercel

1. Push this folder to a GitHub repo and **Import** it in Vercel (framework auto-detected, no config needed).
2. In the project, go to **Storage → Create / Connect Database → Neon (Postgres)**. This sets `DATABASE_URL` automatically.
3. Add env vars `MCP_SECRET` and `NEXT_PUBLIC_SITE_URL` (Settings → Environment Variables).
4. Deploy. The build runs `tsx scripts/migrate.ts`, so tables are created automatically.
5. (Optional) Seed sample data once: `DATABASE_URL=... npm run db:seed` from your machine.

## Testing with curl

REST endpoint (same schema as the MCP tool):

```bash
curl -X POST https://<your-domain>/api/briefs \
  -H "Authorization: Bearer $MCP_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "briefType": "daily-news",
    "date": "2026-10-12",
    "title": "Test day",
    "mood": "calm",
    "tldr": ["One **thing**.", "Two **things**.", "Three **things**."],
    "sections": [{
      "key": "ai", "name": "AI", "emoji": "🤖",
      "overview": "A quiet day in **AI land**.",
      "items": [{
        "headline": "Something happened in AI today",
        "summary": "Here is **what happened** in one sentence.",
        "whyItMatters": "Here is why you should care.",
        "url": "https://www.anthropic.com/news",
        "sourceName": "Anthropic",
        "tag": "Model release"
      }]
    }]
  }'
# → {"ok":true,"url":"https://<your-domain>/b/daily-news/2026-10-12","action":"created",...}
```

Responses: `401` bad token · `422` validation errors (with field paths) · `201` created · `200` replaced.

MCP endpoint (raw JSON-RPC, handy for debugging):

```bash
curl -X POST "https://<your-domain>/api/mcp/$MCP_SECRET" \
  -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" \
  -H "MCP-Protocol-Version: 2025-06-18" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_recent_urls","arguments":{"briefType":"daily-news"}}}'
```

A wrong token returns `404` so the endpoint isn't discoverable.

## Adding the MCP connector to claude.ai

1. Deploy first, and make sure `https://<your-domain>/` loads.
2. In claude.ai, open **Settings → Connectors**.
3. Click **Add custom connector**.
4. **Name:** `Brieflet`. **Remote MCP server URL:** `https://<your-domain>/api/mcp/<MCP_SECRET>`.
   Leave the OAuth / advanced fields empty (auth is the secret in the path).
5. Click **Add**. Claude should list two tools: `save_brief` and `list_recent_urls`.
6. Open each scheduled task (Daily Brief, Power BI Brief) and make sure the **Brieflet** connector is enabled for it. Set the tool permissions to *always allow* so the unattended run isn't blocked waiting for approval.
7. Append the paragraph from [`docs/scheduled-task-prompt.md`](docs/scheduled-task-prompt.md) to both task prompts.
8. Run each task once manually and open the link it sends you.

> 🔐 Treat the connector URL like a password: anyone with it can publish briefs. To rotate, change `MCP_SECRET` in Vercel, redeploy, and update the connector URL.

## MCP tools

**`save_brief`** validates the input with zod (`lib/briefs/schema.ts`), fetches each article's `og:image` and read time server-side when no `imageUrl` is given (4 s timeout, 6 at a time, URL stored only, never rehosted), and upserts by `(briefType, date)` in a transaction. It returns `{ ok, url, action: "created" | "replaced", sections, stories, storiesWithImages }`.

**`list_recent_urls`** takes `{ briefType, days? = 7 }` and returns `{ since, count, urls[], items[{url, headline, date}] }`.

## Reading experience

- **Home**: the latest brief. A 60-second TL;DR card with a mood badge, Instagram-style section rings, a Daily / Power BI switcher, then the scroll feed with sticky section chips.
- **Story mode**: full-screen cards. Tap or click right/left, swipe, or use ← → / Space / Esc. Progress bars, share button, and a "You're all caught up 🎉" end screen with confetti and your streak. It resumes at your first unread story.
- **Every card has a visual**: the article's image, or a deterministic illustrated cover (25 SVG illustrations × 4 layouts × section gradients, no repeats within a section).
- **Streak and read state** are kept per device in `localStorage`. A day counts once you read one story.
- **Shareable URLs:** `/b/<type>/<date>` and `/b/<type>/<date>/s/<n>`, each with a generated OpenGraph image. `?story=3` opens story mode at story 3.
- **Archive** (`/archive`): month calendar, timeline, filter by brief type and tag, and headline/summary search.
- Light and dark mode follow the system setting, with a toggle in the header.

## Project layout

```
app/                    routes (home, /b/..., /archive, /api/briefs, /api/mcp/[token], OG images)
components/             brief-view (server feed), story-mode (client viewer), cover + illustrations, badges
lib/briefs/             schema (zod), save (upsert + enrichment), enrich (og:image), queries
lib/db/                 drizzle schema, client (Neon / PGlite), seed data
lib/mcp/server.ts       MCP tool definitions
docs/                   scheduled-task prompt paragraph
drizzle/                SQL migrations
tests/                  vitest
```
