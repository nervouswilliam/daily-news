import type { Db } from "./index";
import { briefInputSchema, toSgtDate, type BriefInputRaw } from "@/lib/briefs/schema";
import { saveBrief } from "@/lib/briefs/save";

/**
 * Sample briefs so the design is visible immediately.
 * Mostly no imageUrls on purpose, so you can see the illustrated fallbacks.
 */
export function sampleBriefs(date = toSgtDate(new Date())): BriefInputRaw[] {
  return [
    {
      briefType: "daily-news",
      date,
      title: "Open models catch up, tariffs bite, and oil gets jumpy",
      mood: "busy",
      tldr: [
        "An open-weights model **matched frontier benchmarks** at a fraction of the cost, and enterprise buyers noticed.",
        "Fresh US tariffs on chips and EV parts **knocked Asian exporters**; the Fed is in no hurry to cut.",
        "Shipping through Hormuz is **getting nervous** again as Iran talks stall, so oil is up 4% this week.",
      ],
      sections: [
        {
          key: "ai",
          name: "AI",
          emoji: "🤖",
          overview:
            "Big week for **open models** 👀. The gap to the frontier labs is now months, not years, and pricing is collapsing. Meanwhile agents are quietly moving from demos into real back-office work.",
          items: [
            {
              headline: "Open-weights model matches frontier labs on reasoning benchmarks",
              summary:
                "A new open model scored within two points of the top closed systems on maths and coding evals, and it **runs on a single 8-GPU node**.",
              whyItMatters: "Cheaper, self-hostable AI puts pressure on API pricing for everyone.",
              url: "https://www.theverge.com/ai-artificial-intelligence",
              sourceName: "The Verge",
              tag: "Model release",
            },
            {
              headline: "Banks quietly roll out AI agents for back-office reconciliation",
              summary:
                "Three large banks confirmed agents now handle **first-pass reconciliation**, with humans reviewing exceptions only.",
              whyItMatters: "This is the boring, high-volume work where AI ROI actually shows up first.",
              url: "https://www.ft.com/artificial-intelligence",
              sourceName: "Financial Times",
              tag: "Enterprise AI",
            },
            {
              headline: "EU publishes first enforcement guidance under the AI Act",
              summary:
                "Regulators set out how they'll audit **general-purpose models**, including documentation and incident-reporting rules.",
              whyItMatters: "Anyone shipping AI features into Europe now has a concrete compliance checklist.",
              url: "https://www.reuters.com/technology/artificial-intelligence/",
              sourceName: "Reuters",
              tag: "Regulation",
            },
            {
              headline: "Chipmakers race to ship inference-only accelerators",
              summary:
                "Startups and incumbents alike are betting that **inference, not training,** is where the next hardware dollars go.",
              whyItMatters: "Inference costs drive what AI products can afford to do at scale.",
              url: "https://www.bloomberg.com/technology",
              sourceName: "Bloomberg",
              tag: "Chips",
            },
          ],
        },
        {
          key: "us-finance",
          name: "US Finance",
          emoji: "💵",
          overview:
            "The Fed sounded **patient**, which markets read as \"no cuts soon\". Big Tech earnings carried the indices anyway, and bonds didn't love it.",
          items: [
            {
              headline: "Fed minutes signal no rush to cut rates",
              summary: "Officials want **more evidence inflation is cooling** before easing, citing sticky services prices.",
              whyItMatters: "Mortgage and loan rates likely stay elevated through year-end.",
              url: "https://www.cnbc.com/economy/",
              sourceName: "CNBC",
              tag: "Fed",
              sentiment: "down",
            },
            {
              headline: "Cloud earnings beat lifts Nasdaq to record close",
              summary: "AI-driven cloud revenue grew **faster than expected**, pushing megacaps higher.",
              whyItMatters: "AI spending is now showing up in revenue, not just capex.",
              url: "https://www.wsj.com/finance",
              sourceName: "WSJ",
              tag: "Earnings",
              sentiment: "up",
            },
            {
              headline: "10-year Treasury yield climbs back above 4.5%",
              summary: "Strong jobs data and heavy issuance pushed yields up for a **third straight week**.",
              whyItMatters: "Higher yields squeeze valuations for growth stocks.",
              url: "https://www.reuters.com/markets/rates-bonds/",
              sourceName: "Reuters",
              tag: "Bonds",
              sentiment: "down",
            },
          ],
        },
        {
          key: "asia-finance",
          name: "Asia Finance",
          emoji: "🌏",
          overview:
            "Asia took the tariff hit on the chin. **Korea and Taiwan chip stocks** slid, the yen wobbled, and Singapore stayed calm-ish as usual.",
          items: [
            {
              headline: "Korean and Taiwanese chip stocks slide on new US tariffs",
              summary: "Exporters dropped as much as 5% after the US widened tariffs to **advanced packaging**.",
              whyItMatters: "Asia's most important export sector faces a margin squeeze.",
              url: "https://asia.nikkei.com/Business/Tech/Semiconductors",
              sourceName: "Nikkei Asia",
              tag: "Tariffs",
              sentiment: "down",
            },
            {
              headline: "Bank of Japan hints at another hike as yen weakens",
              summary: "Governor flagged **upside inflation risks**, sending the yen briefly stronger.",
              whyItMatters: "A firmer yen ripples through every Asian currency and carry trade.",
              url: "https://www.bloomberg.com/asia",
              sourceName: "Bloomberg",
              tag: "Central banks",
              sentiment: "neutral",
            },
            {
              headline: "Singapore's MAS holds policy steady, says growth is resilient",
              summary: "The MAS left its currency band unchanged and **nudged up its growth forecast**.",
              whyItMatters: "Stable SGD policy keeps imported inflation in check.",
              url: "https://www.straitstimes.com/business",
              sourceName: "The Straits Times",
              tag: "Singapore",
              sentiment: "up",
            },
          ],
        },
        {
          key: "geopolitics",
          name: "Geopolitics",
          emoji: "🌐",
          overview:
            "Two storylines: **trade war round 3** and the Gulf. Neither is boiling over yet, but both moved markets this week.",
          items: [
            {
              headline: "US widens tariffs to chips packaging and EV components",
              summary: "The new list targets **supply-chain workarounds** routed through third countries.",
              whyItMatters: "Expect higher prices on electronics and EVs within two quarters.",
              url: "https://apnews.com/hub/tariffs",
              sourceName: "AP News",
              tag: "Trade war",
            },
            {
              headline: "Iran nuclear talks stall as tanker incidents rise",
              summary: "Negotiators left Oman without a date to resume, while **shipping insurers raised premiums** for the Gulf.",
              whyItMatters: "Oil prices are very sensitive to any Hormuz disruption.",
              url: "https://www.aljazeera.com/tag/iran/",
              sourceName: "Al Jazeera",
              tag: "Iran",
            },
            {
              headline: "China retaliates with export curbs on rare-earth magnets",
              summary: "Beijing added licensing requirements that could **slow shipments to US automakers**.",
              whyItMatters: "Rare earths are a chokepoint for EVs, wind turbines and defence.",
              url: "https://www.scmp.com/economy/china-economy",
              sourceName: "SCMP",
              tag: "China",
            },
          ],
        },
      ],
    },
    {
      briefType: "powerbi",
      date,
      title: "Visual calcs grow up, and a DAX trick worth stealing",
      mood: "calm",
      tldr: [
        "Visual calculations got **new templates**, so running totals take one click now.",
        "A neat **WINDOW() pattern** replaces 30 lines of rank-and-filter DAX.",
        "The Fabric team shipped **deployment pipeline** fixes everyone's been asking for.",
      ],
      sections: [
        {
          key: "report-design",
          name: "Report Design & Visualization",
          emoji: "🎨",
          overview:
            "This week is all about **less clutter, more signal**. A couple of great reads on whitespace and when to kill a chart altogether.",
          items: [
            {
              headline: "Stop using pie charts: five better options for parts-of-whole",
              summary: "A side-by-side gallery showing **bar, waffle and 100% stacked** alternatives with real data.",
              whyItMatters: "Your stakeholders read bars 3× faster than slices.",
              url: "https://www.sqlbi.com/articles/",
              sourceName: "SQLBI",
              tag: "Chart choice",
              difficulty: "beginner",
            },
            {
              headline: "Build a KPI card that actually fits on mobile",
              summary: "Step-by-step layout using the new card visual with **reference labels** and conditional icons.",
              whyItMatters: "Most execs open your report on a phone first.",
              url: "https://powerbi.microsoft.com/en-us/blog/",
              sourceName: "Power BI Blog",
              tag: "Layout",
              difficulty: "intermediate",
            },
          ],
        },
        {
          key: "data-modeling",
          name: "Data Modeling & DAX",
          emoji: "🧮",
          overview:
            "One trick to steal this week: **WINDOW() for top-N-per-group**. It's cleaner than RANKX and much easier to debug.",
          items: [
            {
              headline: "Replace RANKX gymnastics with WINDOW for top-N per category",
              summary: "Using **WINDOW with PARTITIONBY** gets top-3 products per region in a single readable measure.",
              whyItMatters: "Fewer measures, faster visuals, easier handover.",
              url: "https://www.sqlbi.com/articles/",
              sourceName: "SQLBI",
              tag: "DAX tip",
              difficulty: "advanced",
            },
            {
              headline: "Why your date table should never come from Auto date/time",
              summary: "Auto date/time creates **hidden tables per column**, bloating models and breaking time intelligence.",
              whyItMatters: "Turning it off can shrink a model by 20%+.",
              url: "https://radacad.com/blog",
              sourceName: "RADACAD",
              tag: "Modeling",
              difficulty: "beginner",
            },
            {
              headline: "Calculation groups vs field parameters: when to use which",
              summary: "A clear decision table: **calc groups change the maths**, field parameters change what's displayed.",
              whyItMatters: "Picking wrong leads to models nobody can maintain.",
              url: "https://www.youtube.com/@GuyInACube",
              sourceName: "Guy in a Cube",
              tag: "Calc groups",
              difficulty: "intermediate",
            },
          ],
        },
        {
          key: "solutions",
          name: "Building Better Solutions",
          emoji: "🛠️",
          overview:
            "Grown-up BI hygiene: **version control and testing**. Not glamorous, but it's what keeps Friday deploys boring.",
          items: [
            {
              headline: "PBIP plus Git: a practical team workflow",
              summary: "How one team uses **PBIP projects with pull requests** to review report changes like code.",
              whyItMatters: "No more \"final_v7_REAL.pbix\" on SharePoint.",
              url: "https://learn.microsoft.com/power-bi/developer/projects/projects-overview",
              sourceName: "Microsoft Learn",
              tag: "DevOps",
              difficulty: "intermediate",
            },
            {
              headline: "Automate DAX regression tests with semantic link",
              summary: "A notebook that **compares measure outputs** before and after each deploy.",
              whyItMatters: "Catch broken numbers before your CFO does.",
              url: "https://learn.microsoft.com/fabric/data-science/semantic-link-overview",
              sourceName: "Microsoft Learn",
              tag: "Testing",
              difficulty: "advanced",
            },
          ],
        },
        {
          key: "updates",
          name: "Power BI Updates",
          emoji: "🚀",
          overview:
            "The monthly feature drop is light but useful. **Visual calc templates** are the star of the show.",
          items: [
            {
              headline: "Visual calculation templates arrive in preview",
              summary: "Running totals, moving averages and % of parent are now **one-click templates**.",
              whyItMatters: "Report authors can skip writing DAX for common patterns.",
              url: "https://powerbi.microsoft.com/en-us/blog/",
              sourceName: "Power BI Blog",
              tag: "Feature",
              difficulty: "beginner",
            },
            {
              headline: "Deployment pipelines now support selective deploy for semantic models",
              summary: "You can promote **individual items** between stages instead of the whole workspace.",
              whyItMatters: "Safer releases with smaller blast radius.",
              url: "https://learn.microsoft.com/fabric/cicd/deployment-pipelines/intro-to-deployment-pipelines",
              sourceName: "Microsoft Learn",
              tag: "Fabric",
              difficulty: "intermediate",
            },
          ],
        },
      ],
    },
  ];
}

export async function seed(db: Db, date?: string) {
  for (const raw of sampleBriefs(date)) {
    await saveBrief(db, briefInputSchema.parse(raw), { enrich: false });
  }
}
