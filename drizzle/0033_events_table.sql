-- Create events table
CREATE TABLE IF NOT EXISTS "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"title" text NOT NULL,
	"subtitle" text NOT NULL,
	"banner_image_url" text NOT NULL,
	"full_image_url" text NOT NULL,
	"link_url" text,
	"description" text NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"gift" text,
	"reference_text" text,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint

-- Add foreign key
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_admins_id_fk" FOREIGN KEY ("created_by") REFERENCES "admins"("id") ON DELETE set null;

--> statement-breakpoint

-- Create indexes
CREATE INDEX IF NOT EXISTS "events_slug_idx" ON "events" USING btree ("slug");

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "events_is_active_idx" ON "events" USING btree ("is_active");

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "events_created_by_idx" ON "events" USING btree ("created_by");