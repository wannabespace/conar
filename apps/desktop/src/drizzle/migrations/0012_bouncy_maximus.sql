ALTER TYPE "public"."database_type" RENAME TO "connection_type";--> statement-breakpoint
ALTER TABLE "databases" RENAME TO "connections";--> statement-breakpoint
ALTER TABLE "chats" RENAME COLUMN "database_id" TO "connection_id";--> statement-breakpoint
ALTER TABLE "queries" RENAME COLUMN "database_id" TO "connection_id";--> statement-breakpoint
ALTER TABLE "chats" DROP CONSTRAINT "chats_database_id_databases_id_fk";
--> statement-breakpoint
ALTER TABLE "queries" DROP CONSTRAINT "queries_database_id_databases_id_fk";
--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_connection_id_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "queries" ADD CONSTRAINT "queries_connection_id_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."connections"("id") ON DELETE cascade ON UPDATE no action;