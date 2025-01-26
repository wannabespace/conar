CREATE TYPE "public"."database_type" AS ENUM('postgres');--> statement-breakpoint
CREATE TABLE "databases" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "database_type" NOT NULL,
	"name" text,
	"host" text NOT NULL,
	"port" integer NOT NULL,
	"username" text NOT NULL,
	"encryptedPassword" text,
	"database" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "databases" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "databases" ADD CONSTRAINT "databases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;