CREATE TABLE "connections_resources" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"connection_id" uuid NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "connections_resources_connectionId_name_unique" UNIQUE("connection_id","name")
);
--> statement-breakpoint
ALTER TABLE "connections_resources" ADD CONSTRAINT "connections_resources_connection_id_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."connections"("id") ON DELETE cascade ON UPDATE no action;