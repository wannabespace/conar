CREATE TYPE "public"."subscription_period" AS ENUM('monthly', 'yearly');--> statement-breakpoint
CREATE TABLE "device_codes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"device_code" text NOT NULL,
	"user_code" text NOT NULL,
	"user_id" text,
	"expires_at" timestamp with time zone NOT NULL,
	"status" text NOT NULL,
	"last_polled_at" timestamp,
	"polling_interval" integer,
	"client_id" text,
	"scope" text
);
--> statement-breakpoint
ALTER TABLE "accounts" ALTER COLUMN "access_token_expires_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "accounts" ALTER COLUMN "refresh_token_expires_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "invitations" ALTER COLUMN "expires_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "expires_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "period_start" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "period_end" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "trial_start" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "trial_end" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "verifications" ALTER COLUMN "expires_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "period" "subscription_period" NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "cancel_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "reference_id";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "stripe_customer_id";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "seats";