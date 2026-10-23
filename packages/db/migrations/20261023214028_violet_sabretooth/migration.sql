CREATE TABLE "user_encryption_keys" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"secret" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid PRIMARY KEY
);
--> statement-breakpoint
ALTER TABLE "user_encryption_keys" ADD CONSTRAINT "user_encryption_keys_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;