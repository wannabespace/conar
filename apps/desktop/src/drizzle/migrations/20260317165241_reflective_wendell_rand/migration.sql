DELETE FROM "chats";--> statement-breakpoint
DELETE FROM "queries";--> statement-breakpoint
ALTER TABLE "chats" DROP CONSTRAINT "chats_connection_id_connections_id_fk";--> statement-breakpoint
ALTER TABLE "queries" DROP CONSTRAINT "queries_connection_id_connections_id_fk";--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "connection_resource_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "queries" ADD COLUMN "connection_resource_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "chats" DROP COLUMN "connection_id";--> statement-breakpoint
ALTER TABLE "queries" DROP COLUMN "connection_id";--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_connection_resource_id_connections_resources_id_fkey" FOREIGN KEY ("connection_resource_id") REFERENCES "connections_resources"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "queries" ADD CONSTRAINT "queries_connection_resource_id_connections_resources_id_fkey" FOREIGN KEY ("connection_resource_id") REFERENCES "connections_resources"("id") ON DELETE CASCADE;
