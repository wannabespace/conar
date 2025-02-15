ALTER TYPE "public"."database_type" RENAME TO "connection_type";--> statement-breakpoint
ALTER TABLE "databases" RENAME TO "connections";--> statement-breakpoint
ALTER TABLE "connections" DROP CONSTRAINT "databases_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "connections" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "connections" ADD CONSTRAINT "connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;