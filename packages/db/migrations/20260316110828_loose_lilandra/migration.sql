CREATE TABLE "connections_resources" (
	"id" uuid PRIMARY KEY,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"connection_id" uuid NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "connections_resources_connection_id_name_unique" UNIQUE("connection_id","name")
);
--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "connection_resource_id" uuid;--> statement-breakpoint
ALTER TABLE "chats" ALTER COLUMN "connection_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_connection_resource_id_connections_resources_id_fkey" FOREIGN KEY ("connection_resource_id") REFERENCES "connections_resources"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "connections_resources" ADD CONSTRAINT "connections_resources_connection_id_connections_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "connections"("id") ON DELETE CASCADE;