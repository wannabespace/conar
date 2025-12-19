CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"plan" text NOT NULL,
	"reference_id" text NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"status" text DEFAULT 'incomplete',
	"period_start" timestamp,
	"period_end" timestamp,
	"trial_start" timestamp,
	"trial_end" timestamp,
	"cancel_at_period_end" boolean DEFAULT false,
	"seats" integer
);
--> statement-breakpoint
ALTER TABLE "databases" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."database_type";--> statement-breakpoint
CREATE TYPE "public"."database_type" AS ENUM('postgres', 'mysql', 'mssql', 'clickhouse');--> statement-breakpoint
ALTER TABLE "databases" ALTER COLUMN "type" SET DATA TYPE "public"."database_type" USING "type"::"public"."database_type";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripe_customer_id" text;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_stripe_customer_id_users_stripe_customer_id_fk" FOREIGN KEY ("stripe_customer_id") REFERENCES "public"."users"("stripe_customer_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "workspaces_slug_uidx" ON "workspaces" USING btree ("slug");