DROP TABLE "verifications" CASCADE;--> statement-breakpoint
ALTER TABLE "accounts" DROP COLUMN "password";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "email_verified";