ALTER TABLE "organizations" RENAME TO "workspaces";--> statement-breakpoint
ALTER TABLE "invitations" RENAME COLUMN "organization_id" TO "workspace_id";--> statement-breakpoint
ALTER TABLE "members" RENAME COLUMN "organization_id" TO "workspace_id";--> statement-breakpoint
ALTER TABLE "workspaces" DROP CONSTRAINT "organizations_slug_unique";--> statement-breakpoint
ALTER TABLE "invitations" DROP CONSTRAINT "invitations_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "members" DROP CONSTRAINT "members_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_slug_unique" UNIQUE("slug");