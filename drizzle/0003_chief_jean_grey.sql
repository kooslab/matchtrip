CREATE TABLE "user_agreements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"terms_agreed" boolean DEFAULT false NOT NULL,
	"privacy_agreed" boolean DEFAULT false NOT NULL,
	"marketing_agreed" boolean DEFAULT false NOT NULL,
	"terms_agreed_at" timestamp,
	"privacy_agreed_at" timestamp,
	"marketing_agreed_at" timestamp,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_agreements" ADD CONSTRAINT "user_agreements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;