-- Add NOT NULL constraints to display_id columns after populating them
-- Run this AFTER running the populate-display-ids.ts script

ALTER TABLE "offers" ALTER COLUMN "display_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "display_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "product_offers" ALTER COLUMN "display_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "display_id" SET NOT NULL;--> statement-breakpoint