-- Chat v2 stores message parts in the TanStack AI shape, which the v1 (AI SDK)
-- rows cannot be read as. Old conversations are dropped rather than converted.
DELETE FROM chats_messages;--> statement-breakpoint
DELETE FROM chats;
