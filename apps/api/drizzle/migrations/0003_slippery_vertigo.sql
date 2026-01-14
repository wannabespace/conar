CREATE TABLE "queries" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL,
	"database_id" uuid NOT NULL,
	"name" text NOT NULL,
	"query" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "queries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "queries" ADD CONSTRAINT "queries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "queries" ADD CONSTRAINT "queries_database_id_databases_id_fk" FOREIGN KEY ("database_id") REFERENCES "public"."databases"("id") ON DELETE cascade ON UPDATE no action;