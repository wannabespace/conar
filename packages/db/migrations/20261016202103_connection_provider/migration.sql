CREATE TYPE "provider" AS ENUM('cloudflare_d1', 'turso');--> statement-breakpoint
ALTER TABLE "connections" ADD COLUMN "provider" "provider";