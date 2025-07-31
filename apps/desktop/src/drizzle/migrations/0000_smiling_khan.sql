CREATE TYPE "public"."database_type" AS ENUM('postgres');--> statement-breakpoint
CREATE TABLE "chats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"database_id" uuid,
	"title" text NOT NULL,
	"messages" jsonb[] NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chats" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "databases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"type" "database_type" NOT NULL,
	"name" text NOT NULL,
	"connection_string" text NOT NULL,
	"password_exists" boolean NOT NULL
);
--> statement-breakpoint
ALTER TABLE "databases" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_database_id_databases_id_fk" FOREIGN KEY ("database_id") REFERENCES "public"."databases"("id") ON DELETE cascade ON UPDATE no action;