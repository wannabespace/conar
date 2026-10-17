-- Must run before Tamery's migrations: they wipe "chats", drop "chats_messages"."parts" and drop "api_keys".
CREATE TABLE "conar_chats" (LIKE "chats" INCLUDING ALL);--> statement-breakpoint
CREATE TABLE "conar_chats_messages" (LIKE "chats_messages" INCLUDING ALL);--> statement-breakpoint
CREATE TABLE "conar_api_keys" (LIKE "api_keys" INCLUDING ALL);--> statement-breakpoint
INSERT INTO "conar_chats" SELECT * FROM "chats";--> statement-breakpoint
INSERT INTO "conar_chats_messages" SELECT * FROM "chats_messages";--> statement-breakpoint
INSERT INTO "conar_api_keys" SELECT * FROM "api_keys";--> statement-breakpoint
ALTER TABLE "conar_chats" ADD CONSTRAINT "conar_chats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "conar_chats" ADD CONSTRAINT "conar_chats_connection_resource_id_fk" FOREIGN KEY ("connection_resource_id") REFERENCES "connections_resources"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "conar_chats_messages" ADD CONSTRAINT "conar_chats_messages_chat_id_fk" FOREIGN KEY ("chat_id") REFERENCES "conar_chats"("id") ON DELETE CASCADE;
