-- Create settlement_status enum safely
DO $$ BEGIN
 CREATE TYPE "public"."settlement_status" AS ENUM('pending', 'completed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "offer_description_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guide_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "settlements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"commission_rate" integer NOT NULL,
	"commission_amount" integer NOT NULL,
	"tax_rate" integer NOT NULL,
	"tax_amount" integer NOT NULL,
	"settlement_amount" integer NOT NULL,
	"status" "settlement_status" DEFAULT 'pending' NOT NULL,
	"settled_at" timestamp,
	"settled_by" uuid,
	"bank_transfer_ref" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "settlements_payment_id_unique" UNIQUE("payment_id")
);
--> statement-breakpoint
ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "payments_display_id_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "payments_display_id_idx";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users" ADD COLUMN "country_code" varchar(5) DEFAULT '+82';
EXCEPTION
 WHEN duplicate_column THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "offer_description_templates" ADD CONSTRAINT "offer_description_templates_guide_id_users_id_fk" FOREIGN KEY ("guide_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_settled_by_admins_id_fk" FOREIGN KEY ("settled_by") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "offer_description_templates_guide_id_idx" ON "offer_description_templates" USING btree ("guide_id");--> statement-breakpoint
CREATE INDEX "offer_description_templates_created_at_idx" ON "offer_description_templates" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "settlements_payment_id_idx" ON "settlements" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "settlements_status_idx" ON "settlements" USING btree ("status");--> statement-breakpoint
CREATE INDEX "settlements_settled_by_idx" ON "settlements" USING btree ("settled_by");--> statement-breakpoint
CREATE INDEX "settlements_created_at_idx" ON "settlements" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN IF EXISTS "display_id";