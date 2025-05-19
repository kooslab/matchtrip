CREATE TYPE "public"."user_role" AS ENUM('traveler', 'guide', 'admin');--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE user_role;