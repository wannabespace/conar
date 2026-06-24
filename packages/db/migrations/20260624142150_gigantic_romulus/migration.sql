ALTER TABLE "chats" DROP CONSTRAINT "chats_connection_id_connections_id_fk";--> statement-breakpoint
DROP INDEX "chats_connection_id_index";--> statement-breakpoint
ALTER TABLE "chats" DROP COLUMN "connection_id";--> statement-breakpoint
ALTER TABLE "chats" ALTER COLUMN "connection_resource_id" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "chats_connection_resource_id_index" ON "chats" ("connection_resource_id");