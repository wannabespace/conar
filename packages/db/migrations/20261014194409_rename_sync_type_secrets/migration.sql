-- Devices sync rows by updated_at, so a renamed value alone never reaches their local copies.
UPDATE "connections" SET "updated_at" = now() WHERE "sync_type" = 'cloud_without_password';--> statement-breakpoint
ALTER TYPE "sync_type" RENAME VALUE 'cloud_without_password' TO 'cloud_without_secrets';
