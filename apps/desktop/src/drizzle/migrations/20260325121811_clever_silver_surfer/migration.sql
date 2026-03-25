CREATE TYPE "connection_type" AS ENUM('postgres', 'mysql', 'mssql', 'clickhouse');--> statement-breakpoint
CREATE TYPE "sync_type" AS ENUM('cloud', 'cloud_without_password');--> statement-breakpoint
CREATE TABLE "chats" (
	"id" uuid PRIMARY KEY,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"connection_resource_id" uuid NOT NULL,
	"title" text
);
--> statement-breakpoint
CREATE TABLE "chats_messages" (
	"id" uuid PRIMARY KEY,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"chat_id" uuid NOT NULL,
	"parts" jsonb[] NOT NULL,
	"role" text NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "connections" (
	"id" uuid PRIMARY KEY,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"type" "connection_type" NOT NULL,
	"name" text NOT NULL,
	"connection_string" text NOT NULL,
	"label" text,
	"color" text,
	"password_exists" boolean NOT NULL,
	"password_populated" boolean NOT NULL,
	"sync_type" "sync_type" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "connections_resources" (
	"id" uuid PRIMARY KEY,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"connection_id" uuid NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "connections_resources_connection_id_name_unique" UNIQUE("connection_id","name")
);
--> statement-breakpoint
CREATE TABLE "queries" (
	"id" uuid PRIMARY KEY,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"connection_resource_id" uuid NOT NULL,
	"name" text NOT NULL,
	"query" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_connection_resource_id_connections_resources_id_fkey" FOREIGN KEY ("connection_resource_id") REFERENCES "connections_resources"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "chats_messages" ADD CONSTRAINT "chats_messages_chat_id_chats_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "connections_resources" ADD CONSTRAINT "connections_resources_connection_id_connections_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "connections"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "queries" ADD CONSTRAINT "queries_connection_resource_id_connections_resources_id_fkey" FOREIGN KEY ("connection_resource_id") REFERENCES "connections_resources"("id") ON DELETE CASCADE;