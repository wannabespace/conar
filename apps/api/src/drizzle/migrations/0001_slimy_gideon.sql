CREATE INDEX "accounts_user_id_index" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "invitations_email_index" ON "invitations" USING btree ("email");--> statement-breakpoint
CREATE INDEX "invitations_workspace_id_index" ON "invitations" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "members_user_id_index" ON "members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "members_workspace_id_index" ON "members" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "sessions_user_id_index" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_token_index" ON "sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "users_email_index" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "verifications_identifier_index" ON "verifications" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "workspaces_slug_index" ON "workspaces" USING btree ("slug");