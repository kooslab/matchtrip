ALTER TABLE "offers" ADD COLUMN "display_id" varchar(20);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "display_id" varchar(20);--> statement-breakpoint
ALTER TABLE "product_offers" ADD COLUMN "display_id" varchar(20);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "display_id" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_hash" text;--> statement-breakpoint
CREATE INDEX "offers_display_id_idx" ON "offers" USING btree ("display_id");--> statement-breakpoint
CREATE INDEX "payments_display_id_idx" ON "payments" USING btree ("display_id");--> statement-breakpoint
CREATE INDEX "product_offers_display_id_idx" ON "product_offers" USING btree ("display_id");--> statement-breakpoint
CREATE INDEX "products_display_id_idx" ON "products" USING btree ("display_id");--> statement-breakpoint
CREATE INDEX "users_email_hash_idx" ON "users" USING btree ("email_hash");--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_display_id_unique" UNIQUE("display_id");--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_display_id_unique" UNIQUE("display_id");--> statement-breakpoint
ALTER TABLE "product_offers" ADD CONSTRAINT "product_offers_display_id_unique" UNIQUE("display_id");--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_display_id_unique" UNIQUE("display_id");