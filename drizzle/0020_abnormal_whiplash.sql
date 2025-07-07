ALTER TABLE "admins" ADD COLUMN "is_approved" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "admins" ADD COLUMN "approved_at" timestamp;--> statement-breakpoint
ALTER TABLE "admins" ADD COLUMN "approved_by" uuid;--> statement-breakpoint
ALTER TABLE "guide_profiles" ADD COLUMN "username" text;--> statement-breakpoint
ALTER TABLE "guide_profiles" ADD COLUMN "qualifications" jsonb;--> statement-breakpoint
ALTER TABLE "traveler_profiles" ADD COLUMN "username" text;