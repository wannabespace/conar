ALTER TABLE "public"."databases" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."database_type";--> statement-breakpoint
CREATE TYPE "public"."database_type" AS ENUM('postgres');--> statement-breakpoint
ALTER TABLE "public"."databases" ALTER COLUMN "type" SET DATA TYPE "public"."database_type" USING "type"::"public"."database_type";