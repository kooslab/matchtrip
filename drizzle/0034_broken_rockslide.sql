CREATE TABLE "user_deletions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"original_email" text NOT NULL,
	"original_name" text,
	"original_phone" text,
	"user_role" text,
	"reason" text,
	"details" text,
	"deleted_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "user_deletions_deleted_at_idx" ON "user_deletions" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "user_deletions_user_id_idx" ON "user_deletions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_deletions_user_role_idx" ON "user_deletions" USING btree ("user_role");