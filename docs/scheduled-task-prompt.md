# Paragraph to append to your scheduled-task prompts

Paste the block below at the end of **both** scheduled-task prompts. Change the one line marked `BRIEF TYPE` in each task:

- Daily Brief task: `briefType` = `daily-news`. Section keys: `ai`, `us-finance`, `asia-finance`, `geopolitics`
- Power BI Brief task: `briefType` = `powerbi`. Section keys: `report-design`, `data-modeling`, `solutions`, `updates`

---

```text
## Publishing to Brieflet
You have the Brieflet connector (tools: list_recent_urls, save_brief). Follow these steps exactly.

BRIEF TYPE: use briefType "daily-news" (change to "powerbi" for the Power BI Brief).

1. BEFORE researching, call list_recent_urls with this briefType. Do not include any story whose URL (or an obviously identical story from another outlet) appears in that list. Find fresh stories instead.
2. While researching, for every article you pick, note its og:image URL (the <meta property="og:image"> of the page) if you can see it. Only use https image URLs. If you can't find it, leave imageUrl out. Never invent one; Brieflet will try to fetch it or draw an illustration.
3. Write for a very lazy reader on a phone:
   - headline: punchy, max 12 words, no clickbait.
   - summary: 1–2 short sentences. Wrap the single most important phrase in **double asterisks**.
   - whyItMatters: exactly one sentence about the impact on the reader.
   - tag: a 1–3 word label (e.g. "Model release", "Tariffs", "Earnings", "DAX tip", "Fabric").
   - sentiment ("up" | "down" | "neutral") for finance stories only (market/asset direction); difficulty ("beginner" | "intermediate" | "advanced") for Power BI stories only.
   - Each section: key (the slug above), name, one emoji, an overview of 2–4 casual, conversational sentences with one **bold** phrase, and 3–6 items.
4. Pick the day's mood from the overall news: "calm", "busy", "tense" or "wild".
5. Write the TL;DR: exactly 3 bullets, each one sentence, together summarising the whole day in 60 seconds. Bold one key phrase per bullet with **…**.
6. Write a short, specific title for the day (max ~10 words).
7. Call save_brief once with: briefType, date (today's date in Singapore time, YYYY-MM-DD), title, tldr, mood, and sections (each with its items: headline, summary, whyItMatters, url, sourceName, imageUrl if known, tag, plus sentiment/difficulty where relevant).
   If save_brief returns a validation error, fix exactly the fields it names and call it again. Re-running for the same day safely replaces the earlier version.
8. In the message you send me, start with the "url" returned by save_brief on its own line ("📱 Read it in Brieflet: <url>"), then the 3 TL;DR bullets. Keep the rest of your usual summary short.
```
