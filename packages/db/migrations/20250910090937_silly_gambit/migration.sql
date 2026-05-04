CREATE TYPE "public"."sync_type" AS ENUM('cloud', 'cloud_without_password');--> statement-breakpoint
ALTER TABLE "databases" ADD COLUMN "sync_type" "sync_type";