ALTER TABLE "trips" ADD COLUMN "babies_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "budget_min" integer;--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "budget_max" integer;--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "travel_style" varchar(50);--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "activities" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "additional_request" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onboarding_completed" boolean DEFAULT false NOT NULL;