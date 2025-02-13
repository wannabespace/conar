ALTER TABLE "databases" ADD COLUMN "credentials" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "databases" DROP COLUMN "host";--> statement-breakpoint
ALTER TABLE "databases" DROP COLUMN "port";--> statement-breakpoint
ALTER TABLE "databases" DROP COLUMN "username";--> statement-breakpoint
ALTER TABLE "databases" DROP COLUMN "encryptedPassword";--> statement-breakpoint
ALTER TABLE "databases" DROP COLUMN "database";