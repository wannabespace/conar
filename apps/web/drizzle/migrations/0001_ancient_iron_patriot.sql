ALTER TYPE "public"."subscription_type" RENAME TO "subscription_period";--> statement-breakpoint
ALTER TYPE "public"."subscription_period" ADD VALUE 'yearly';--> statement-breakpoint
ALTER TABLE "subscriptions" RENAME COLUMN "type" TO "period";