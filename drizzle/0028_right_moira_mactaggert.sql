ALTER TABLE "users" ADD COLUMN "email_hash" text;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_hash_unique" UNIQUE("email_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_email_hash_idx" ON "users" USING btree ("email_hash");