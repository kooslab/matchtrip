CREATE TYPE "public"."cancellation_reason_guide" AS ENUM('traveler_request', 'traveler_unresponsive', 'facility_unavailable', 'guide_unavailable', 'natural_disaster', 'medical_emergency', 'other');--> statement-breakpoint
CREATE TYPE "public"."cancellation_reason_traveler" AS ENUM('schedule_change', 'booking_mismatch', 'guide_unresponsive', 'guide_unavailable', 'natural_disaster', 'medical_emergency', 'other');--> statement-breakpoint
CREATE TYPE "public"."cancellation_status" AS ENUM('pending', 'approved', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."kakao_notification_status" AS ENUM('pending', 'sent', 'delivered', 'failed');--> statement-breakpoint
CREATE TABLE "cancellation_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"requester_id" uuid NOT NULL,
	"requester_type" "user_role" NOT NULL,
	"reason_type" varchar(50) NOT NULL,
	"reason_detail" text,
	"supporting_documents" jsonb,
	"calculated_refund_amount" integer NOT NULL,
	"actual_refund_amount" integer,
	"status" "cancellation_status" DEFAULT 'pending' NOT NULL,
	"admin_notes" text,
	"processed_by" uuid,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kakao_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"template_code" text NOT NULL,
	"phone_number" text NOT NULL,
	"status" "kakao_notification_status" DEFAULT 'pending' NOT NULL,
	"message_id" text,
	"bulk_id" text,
	"template_data" jsonb,
	"error_message" text,
	"sent_at" timestamp,
	"delivered_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_refunds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"refund_amount" integer NOT NULL,
	"refund_type" varchar(20) NOT NULL,
	"refund_reason" text,
	"toss_transaction_key" text,
	"toss_response" jsonb,
	"processed_by" uuid,
	"status" varchar(20) DEFAULT 'completed' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refund_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"days_before_start" integer NOT NULL,
	"days_before_end" integer,
	"refund_percentage" integer NOT NULL,
	"applicable_to" varchar(20) DEFAULT 'trip' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" text NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"payload" jsonb NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"processed_at" timestamp,
	"error_message" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "webhook_events_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
ALTER TABLE "reviews" ALTER COLUMN "trip_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "reviews" ALTER COLUMN "offer_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "cancelled_at" timestamp;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "refunded_at" timestamp;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "refund_amount" integer;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "cancellation_request_id" uuid;--> statement-breakpoint
ALTER TABLE "product_offers" ADD COLUMN "start_date" timestamp;--> statement-breakpoint
ALTER TABLE "product_offers" ADD COLUMN "end_date" timestamp;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "product_id" uuid;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "product_offer_id" uuid;--> statement-breakpoint
ALTER TABLE "cancellation_requests" ADD CONSTRAINT "cancellation_requests_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cancellation_requests" ADD CONSTRAINT "cancellation_requests_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cancellation_requests" ADD CONSTRAINT "cancellation_requests_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kakao_notifications" ADD CONSTRAINT "kakao_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_refunds" ADD CONSTRAINT "payment_refunds_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_refunds" ADD CONSTRAINT "payment_refunds_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cancellation_requests_payment_id_idx" ON "cancellation_requests" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "cancellation_requests_requester_id_idx" ON "cancellation_requests" USING btree ("requester_id");--> statement-breakpoint
CREATE INDEX "cancellation_requests_status_idx" ON "cancellation_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "cancellation_requests_created_at_idx" ON "cancellation_requests" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "kakao_notifications_user_id_idx" ON "kakao_notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "kakao_notifications_template_code_idx" ON "kakao_notifications" USING btree ("template_code");--> statement-breakpoint
CREATE INDEX "kakao_notifications_status_idx" ON "kakao_notifications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "kakao_notifications_created_at_idx" ON "kakao_notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "payment_refunds_payment_id_idx" ON "payment_refunds" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "payment_refunds_processed_by_idx" ON "payment_refunds" USING btree ("processed_by");--> statement-breakpoint
CREATE INDEX "payment_refunds_status_idx" ON "payment_refunds" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payment_refunds_created_at_idx" ON "payment_refunds" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "refund_policies_applicable_to_idx" ON "refund_policies" USING btree ("applicable_to");--> statement-breakpoint
CREATE INDEX "refund_policies_is_active_idx" ON "refund_policies" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "webhook_events_event_id_idx" ON "webhook_events" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "webhook_events_event_type_idx" ON "webhook_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "webhook_events_status_idx" ON "webhook_events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "webhook_events_created_at_idx" ON "webhook_events" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_offer_id_product_offers_id_fk" FOREIGN KEY ("product_offer_id") REFERENCES "public"."product_offers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reviews_product_id_idx" ON "reviews" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "reviews_product_traveler_unique" ON "reviews" USING btree ("product_id","traveler_id");