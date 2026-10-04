ALTER TYPE "ai_feature" ADD VALUE IF NOT EXISTS 'complete_sql' BEFORE 'filters';--> statement-breakpoint
ALTER TYPE "sync_type" ADD VALUE 'cloud_without_connection_string';--> statement-breakpoint
ALTER TABLE "connections" ALTER COLUMN "connection_string" DROP NOT NULL;