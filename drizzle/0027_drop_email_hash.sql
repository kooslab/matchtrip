DROP INDEX "users_email_hash_idx";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "email_hash";