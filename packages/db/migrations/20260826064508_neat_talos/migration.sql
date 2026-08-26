-- Chat history predating the parts split has no recoverable parts (app-layer
-- encryption); wipe it instead of keeping empty messages.
DELETE FROM "chats";--> statement-breakpoint
CREATE TABLE "chats_messages_parts" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"message_id" uuid NOT NULL,
	"order" integer NOT NULL,
	"part" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chats" DROP COLUMN "active_stream_id";--> statement-breakpoint
ALTER TABLE "chats_messages" DROP COLUMN "parts";--> statement-breakpoint
CREATE INDEX "chats_messages_parts_message_id_index" ON "chats_messages_parts" ("message_id");--> statement-breakpoint
ALTER TABLE "chats_messages_parts" ADD CONSTRAINT "chats_messages_parts_message_id_chats_messages_id_fkey" FOREIGN KEY ("message_id") REFERENCES "chats_messages"("id") ON DELETE CASCADE;