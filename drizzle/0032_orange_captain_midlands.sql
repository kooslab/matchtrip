CREATE TYPE "public"."report_status" AS ENUM('pending', 'reviewing', 'resolved', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."report_type" AS ENUM('scam', 'inappropriate_ads', 'fraud', 'harassment', 'contact_info_leak');--> statement-breakpoint
CREATE TABLE "banners" (
	"id" serial PRIMARY KEY NOT NULL,
	"banner_image_url" text NOT NULL,
	"full_image_url" text NOT NULL,
	"link_url" text NOT NULL,
	"description" text NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_id" uuid NOT NULL,
	"reported_user_id" uuid NOT NULL,
	"conversation_id" uuid,
	"product_conversation_id" uuid,
	"product_id" uuid,
	"offer_id" uuid,
	"report_type" "report_type" NOT NULL,
	"description" text,
	"status" "report_status" DEFAULT 'pending' NOT NULL,
	"resolved_by" uuid,
	"resolved_at" timestamp,
	"resolution_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "guide_profiles" ADD COLUMN "contract_agreed_at" timestamp;--> statement-breakpoint
ALTER TABLE "guide_profiles" ADD COLUMN "contract_version" text;--> statement-breakpoint
ALTER TABLE "guide_profiles" ADD COLUMN "contract_scroll_completed" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "guide_profiles" ADD COLUMN "contract_address" text;--> statement-breakpoint
ALTER TABLE "guide_profiles" ADD COLUMN "business_registration_number" text;--> statement-breakpoint
ALTER TABLE "banners" ADD CONSTRAINT "banners_created_by_admins_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reported_user_id_users_id_fk" FOREIGN KEY ("reported_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_product_conversation_id_product_conversations_id_fk" FOREIGN KEY ("product_conversation_id") REFERENCES "public"."product_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_offer_id_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_resolved_by_admins_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "banners_is_active_idx" ON "banners" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "banners_created_by_idx" ON "banners" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "reports_reporter_id_idx" ON "reports" USING btree ("reporter_id");--> statement-breakpoint
CREATE INDEX "reports_reported_user_id_idx" ON "reports" USING btree ("reported_user_id");--> statement-breakpoint
CREATE INDEX "reports_status_idx" ON "reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "reports_report_type_idx" ON "reports" USING btree ("report_type");--> statement-breakpoint
CREATE INDEX "reports_created_at_idx" ON "reports" USING btree ("created_at");