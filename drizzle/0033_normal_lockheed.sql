-- Create FAQ target role enum
DO $$ BEGIN
 CREATE TYPE "public"."faq_target_role" AS ENUM('guide', 'traveler', 'both');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create FAQs table
CREATE TABLE IF NOT EXISTS "faqs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"target_role" "faq_target_role" NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Add foreign key for FAQs
DO $$ BEGIN
 ALTER TABLE "faqs" ADD CONSTRAINT "faqs_created_by_admins_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create indexes for FAQs
CREATE INDEX IF NOT EXISTS "faqs_target_role_idx" ON "faqs" USING btree ("target_role");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "faqs_is_active_idx" ON "faqs" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "faqs_display_order_idx" ON "faqs" USING btree ("display_order");