CREATE TABLE "briefs" (
	"id" serial PRIMARY KEY NOT NULL,
	"brief_type" text NOT NULL,
	"date" date NOT NULL,
	"title" text NOT NULL,
	"tldr" jsonb NOT NULL,
	"mood" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" serial PRIMARY KEY NOT NULL,
	"section_id" integer NOT NULL,
	"brief_id" integer NOT NULL,
	"headline" text NOT NULL,
	"summary" text NOT NULL,
	"why_it_matters" text NOT NULL,
	"url" text NOT NULL,
	"source_name" text NOT NULL,
	"image_url" text,
	"image_source" text DEFAULT 'none' NOT NULL,
	"tag" text NOT NULL,
	"sentiment" text,
	"difficulty" text,
	"read_minutes" integer,
	"position" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"brief_id" integer NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"emoji" text NOT NULL,
	"overview" text NOT NULL,
	"position" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_brief_id_briefs_id_fk" FOREIGN KEY ("brief_id") REFERENCES "public"."briefs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sections" ADD CONSTRAINT "sections_brief_id_briefs_id_fk" FOREIGN KEY ("brief_id") REFERENCES "public"."briefs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "briefs_type_date_uq" ON "briefs" USING btree ("brief_type","date");--> statement-breakpoint
CREATE INDEX "items_brief_idx" ON "items" USING btree ("brief_id");--> statement-breakpoint
CREATE INDEX "items_section_idx" ON "items" USING btree ("section_id");--> statement-breakpoint
CREATE INDEX "sections_brief_idx" ON "sections" USING btree ("brief_id");