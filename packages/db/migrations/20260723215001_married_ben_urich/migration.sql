ALTER TABLE "connections" ADD COLUMN "workspace_id" uuid;--> statement-breakpoint
CREATE INDEX "connections_workspaceId_idx" ON "connections" ("workspace_id");--> statement-breakpoint
ALTER TABLE "connections" ADD CONSTRAINT "connections_workspace_id_workspaces_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE;