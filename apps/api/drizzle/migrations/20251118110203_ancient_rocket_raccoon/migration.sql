ALTER TABLE "invitations" RENAME COLUMN "organization_id" TO "workspace_id";--> statement-breakpoint
ALTER TABLE "members" RENAME COLUMN "organization_id" TO "workspace_id";--> statement-breakpoint
ALTER TABLE "sessions" RENAME COLUMN "active_organization_id" TO "active_workspace_id";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_normalized_email_unique";--> statement-breakpoint
ALTER TABLE "invitations" DROP CONSTRAINT "invitations_organization_id_workspaces_id_fk";
--> statement-breakpoint
ALTER TABLE "members" DROP CONSTRAINT "members_organization_id_workspaces_id_fk";
--> statement-breakpoint
DROP INDEX "invitations_organization_id_index";--> statement-breakpoint
DROP INDEX "members_organization_id_index";--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "expires_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "workspaces" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "invitations_workspace_id_index" ON "invitations" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "members_workspace_id_index" ON "members" USING btree ("workspace_id");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_normalizedEmail_unique" UNIQUE("normalized_email");