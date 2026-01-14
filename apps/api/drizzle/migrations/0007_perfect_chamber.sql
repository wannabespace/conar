CREATE INDEX "chats_user_id_index" ON "chats" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "chats_database_id_index" ON "chats" USING btree ("database_id");--> statement-breakpoint
CREATE INDEX "chats_messages_chat_id_index" ON "chats_messages" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "chats_messages_role_index" ON "chats_messages" USING btree ("role");