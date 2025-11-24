ALTER TABLE "users" DROP CONSTRAINT "users_normalizedEmail_unique";--> statement-breakpoint
DROP INDEX "accounts_user_id_index";--> statement-breakpoint
DROP INDEX "invitations_email_index";--> statement-breakpoint
DROP INDEX "invitations_workspace_id_index";--> statement-breakpoint
DROP INDEX "invitations_inviter_id_index";--> statement-breakpoint
DROP INDEX "members_user_id_index";--> statement-breakpoint
DROP INDEX "members_workspace_id_index";--> statement-breakpoint
DROP INDEX "sessions_user_id_index";--> statement-breakpoint
DROP INDEX "sessions_token_index";--> statement-breakpoint
DROP INDEX "users_email_index";--> statement-breakpoint
DROP INDEX "verifications_identifier_index";--> statement-breakpoint
DROP INDEX "workspaces_slug_index";--> statement-breakpoint
ALTER TABLE "accounts" ALTER COLUMN "access_token_expires_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "accounts" ALTER COLUMN "refresh_token_expires_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "invitations" ALTER COLUMN "expires_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "active_workspace_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "is_anonymous" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "verifications" ALTER COLUMN "expires_at" SET DATA TYPE timestamp;--> statement-breakpoint
CREATE INDEX "accounts_userId_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "invitations_workspaceId_idx" ON "invitations" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "invitations_email_idx" ON "invitations" USING btree ("email");--> statement-breakpoint
CREATE INDEX "members_workspaceId_idx" ON "members" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "members_userId_idx" ON "members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_userId_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "twoFactors_secret_idx" ON "two_factors" USING btree ("secret");--> statement-breakpoint
CREATE INDEX "twoFactors_userId_idx" ON "two_factors" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verifications_identifier_idx" ON "verifications" USING btree ("identifier");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_normalized_email_unique" UNIQUE("normalized_email");