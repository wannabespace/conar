CREATE TYPE "ai_feature" AS ENUM('chat', 'chat_title', 'filters', 'fix_sql', 'update_sql');--> statement-breakpoint
CREATE TABLE "ai_usage" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"cache_read_tokens" integer DEFAULT 0 NOT NULL,
	"cache_write_tokens" integer DEFAULT 0 NOT NULL,
	"chat_id" uuid,
	"cost" numeric(12,8),
	"feature" "ai_feature" NOT NULL,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"model" text NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"user_id" uuid NOT NULL,
	"workspace_id" uuid
);
--> statement-breakpoint
CREATE INDEX "ai_usage_user_id_created_at_index" ON "ai_usage" ("user_id","created_at");--> statement-breakpoint
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_chat_id_chats_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_workspace_id_workspaces_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE SET NULL;