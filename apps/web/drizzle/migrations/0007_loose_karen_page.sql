ALTER TYPE "public"."database_type" ADD VALUE 'mongodb';--> statement-breakpoint
ALTER TYPE "public"."database_type" ADD VALUE 'mysql';--> statement-breakpoint
ALTER TABLE "databases" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "databases" ADD COLUMN "connectionString" text NOT NULL;--> statement-breakpoint
ALTER TABLE "databases" DROP COLUMN "credentials";