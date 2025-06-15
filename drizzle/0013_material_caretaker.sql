CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"offer_id" uuid NOT NULL,
	"guide_id" uuid NOT NULL,
	"traveler_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"content" text NOT NULL,
	"review_token" text,
	"review_requested_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_review_token_unique" UNIQUE("review_token")
);
--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_offer_id_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_guide_id_users_id_fk" FOREIGN KEY ("guide_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_traveler_id_users_id_fk" FOREIGN KEY ("traveler_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reviews_guide_id_idx" ON "reviews" USING btree ("guide_id");--> statement-breakpoint
CREATE INDEX "reviews_trip_id_idx" ON "reviews" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "reviews_traveler_id_idx" ON "reviews" USING btree ("traveler_id");--> statement-breakpoint
CREATE INDEX "reviews_rating_idx" ON "reviews" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "reviews_review_token_idx" ON "reviews" USING btree ("review_token");--> statement-breakpoint
CREATE INDEX "reviews_trip_traveler_unique" ON "reviews" USING btree ("trip_id","traveler_id");