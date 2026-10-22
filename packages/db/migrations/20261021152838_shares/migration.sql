CREATE TYPE "share_refresh" AS ENUM('live', 'minute', 'hour', 'day');--> statement-breakpoint
CREATE TABLE "shares" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"connection_resource_id" uuid NOT NULL,
	"description" text,
	"expires_at" timestamp with time zone,
	"failing_since" timestamp with time zone,
	"name" text NOT NULL,
	"password_hash" text,
	"refresh" "share_refresh" NOT NULL,
	"schema" text NOT NULL,
	"table" text NOT NULL,
	"user_id" uuid NOT NULL,
	"view" text NOT NULL
);
--> statement-breakpoint
CREATE INDEX "shares_user_id_index" ON "shares" ("user_id");--> statement-breakpoint
CREATE INDEX "shares_connection_resource_id_index" ON "shares" ("connection_resource_id");--> statement-breakpoint
ALTER TABLE "shares" ADD CONSTRAINT "shares_connection_resource_id_connections_resources_id_fkey" FOREIGN KEY ("connection_resource_id") REFERENCES "connections_resources"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "shares" ADD CONSTRAINT "shares_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;