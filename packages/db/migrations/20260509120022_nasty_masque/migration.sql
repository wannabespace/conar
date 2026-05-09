CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"config_id" text DEFAULT 'default' NOT NULL,
	"name" text NOT NULL,
	"start" text,
	"reference_id" text NOT NULL,
	"prefix" text,
	"key" text NOT NULL,
	"refill_interval" integer,
	"refill_amount" integer,
	"last_refill_at" timestamp with time zone,
	"enabled" boolean DEFAULT true,
	"rate_limit_enabled" boolean DEFAULT true,
	"rate_limit_time_window" integer DEFAULT 86400000,
	"rate_limit_max" integer DEFAULT 10,
	"request_count" integer DEFAULT 0,
	"remaining" integer,
	"last_request" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"permissions" jsonb,
	"metadata" text
);
--> statement-breakpoint
ALTER TABLE "two_factors" ADD COLUMN "verified" boolean DEFAULT true;--> statement-breakpoint
CREATE INDEX "api_keys_configId_idx" ON "api_keys" ("config_id");--> statement-breakpoint
CREATE INDEX "api_keys_referenceId_idx" ON "api_keys" ("reference_id");--> statement-breakpoint
CREATE INDEX "api_keys_key_idx" ON "api_keys" ("key");