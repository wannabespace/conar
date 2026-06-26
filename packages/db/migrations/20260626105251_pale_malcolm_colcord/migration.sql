ALTER TABLE "queries" DROP CONSTRAINT "queries_connection_id_connections_id_fk";--> statement-breakpoint
ALTER TABLE "queries" DROP COLUMN "connection_id";--> statement-breakpoint
ALTER TABLE "queries" ALTER COLUMN "connection_resource_id" SET NOT NULL;