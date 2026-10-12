import {
  pgTable,
  serial,
  integer,
  text,
  date,
  jsonb,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const briefs = pgTable(
  "briefs",
  {
    id: serial("id").primaryKey(),
    briefType: text("brief_type").$type<"daily-news" | "powerbi">().notNull(),
    date: date("date", { mode: "string" }).notNull(),
    title: text("title").notNull(),
    tldr: jsonb("tldr").$type<string[]>().notNull(),
    mood: text("mood").$type<"calm" | "busy" | "tense" | "wild">().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("briefs_type_date_uq").on(t.briefType, t.date)],
);

export const sections = pgTable(
  "sections",
  {
    id: serial("id").primaryKey(),
    briefId: integer("brief_id")
      .notNull()
      .references(() => briefs.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    name: text("name").notNull(),
    emoji: text("emoji").notNull(),
    overview: text("overview").notNull(),
    position: integer("position").notNull(),
  },
  (t) => [index("sections_brief_idx").on(t.briefId)],
);

export const items = pgTable(
  "items",
  {
    id: serial("id").primaryKey(),
    sectionId: integer("section_id")
      .notNull()
      .references(() => sections.id, { onDelete: "cascade" }),
    // Denormalised so archive search / recent-URL queries don't need joins.
    briefId: integer("brief_id")
      .notNull()
      .references(() => briefs.id, { onDelete: "cascade" }),
    headline: text("headline").notNull(),
    summary: text("summary").notNull(),
    whyItMatters: text("why_it_matters").notNull(),
    url: text("url").notNull(),
    sourceName: text("source_name").notNull(),
    imageUrl: text("image_url"),
    imageSource: text("image_source").$type<"provided" | "og" | "none">().notNull().default("none"),
    tag: text("tag").notNull(),
    sentiment: text("sentiment").$type<"up" | "down" | "neutral">(),
    difficulty: text("difficulty").$type<"beginner" | "intermediate" | "advanced">(),
    readMinutes: integer("read_minutes"),
    position: integer("position").notNull(),
  },
  (t) => [index("items_brief_idx").on(t.briefId), index("items_section_idx").on(t.sectionId)],
);

export type BriefRow = typeof briefs.$inferSelect;
export type SectionRow = typeof sections.$inferSelect;
export type ItemRow = typeof items.$inferSelect;
