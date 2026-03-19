ALTER TABLE "queries" ADD COLUMN "connection_resource_id" uuid;--> statement-breakpoint
ALTER TABLE "queries" ALTER COLUMN "connection_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "queries" ADD CONSTRAINT "queries_connection_resource_id_connections_resources_id_fkey" FOREIGN KEY ("connection_resource_id") REFERENCES "connections_resources"("id") ON DELETE CASCADE;