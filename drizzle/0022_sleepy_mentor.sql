CREATE TYPE "public"."message_type" AS ENUM('text', 'cancellation_request', 'cancellation_response');--> statement-breakpoint
CREATE TABLE "continents" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"code" varchar(2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "continents_name_unique" UNIQUE("name"),
	CONSTRAINT "continents_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "countries" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(3) NOT NULL,
	"continent_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "countries_name_unique" UNIQUE("name"),
	CONSTRAINT "countries_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "destinations" DROP CONSTRAINT "destinations_city_unique";--> statement-breakpoint
DROP INDEX "destinations_country_idx";--> statement-breakpoint
ALTER TABLE "destinations" ALTER COLUMN "city" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "destinations" ADD COLUMN "country_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "message_type" "message_type" DEFAULT 'text' NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "offers" ADD COLUMN "description_images" text[];--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "images" text[];--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "tags" text[];--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_deleted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "countries" ADD CONSTRAINT "countries_continent_id_continents_id_fk" FOREIGN KEY ("continent_id") REFERENCES "public"."continents"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "continents_name_idx" ON "continents" USING btree ("name");--> statement-breakpoint
CREATE INDEX "continents_code_idx" ON "continents" USING btree ("code");--> statement-breakpoint
CREATE INDEX "countries_name_idx" ON "countries" USING btree ("name");--> statement-breakpoint
CREATE INDEX "countries_code_idx" ON "countries" USING btree ("code");--> statement-breakpoint
CREATE INDEX "countries_continent_id_idx" ON "countries" USING btree ("continent_id");--> statement-breakpoint
ALTER TABLE "destinations" ADD CONSTRAINT "destinations_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "destinations_country_id_idx" ON "destinations" USING btree ("country_id");--> statement-breakpoint
CREATE INDEX "destinations_city_country_unique" ON "destinations" USING btree ("city","country_id");--> statement-breakpoint
CREATE INDEX "users_is_deleted_idx" ON "users" USING btree ("is_deleted");--> statement-breakpoint
ALTER TABLE "destinations" DROP COLUMN "country";--> statement-breakpoint
ALTER TABLE "public"."users" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."user_role";--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('traveler', 'guide');--> statement-breakpoint
ALTER TABLE "public"."users" ALTER COLUMN "role" SET DATA TYPE "public"."user_role" USING "role"::"public"."user_role";