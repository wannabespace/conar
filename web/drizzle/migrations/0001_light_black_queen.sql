ALTER TABLE "users" ADD COLUMN "normalized_email" text;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_normalized_email_unique" UNIQUE("normalized_email");