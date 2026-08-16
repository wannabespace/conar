CREATE TEMP TABLE _default_workspaces AS
SELECT
  u.id AS user_id,
  encode(set_bit(set_bit(overlay(uuid_send(gen_random_uuid()) placing substring(int8send((extract(epoch from clock_timestamp()) * 1000)::bigint) from 3) from 1 for 6), 52, 1), 53, 1), 'hex')::uuid AS workspace_id,
  coalesce(nullif(trim(u.name), ''), nullif(split_part(u.email, '@', 1), ''), 'My') || '''s workspace' AS workspace_name
FROM users u
WHERE NOT EXISTS (
  SELECT 1
  FROM members m
  JOIN workspaces w ON w.id = m.workspace_id
  WHERE m.user_id = u.id
    AND w.metadata IS NOT NULL
    AND w.metadata::jsonb ->> 'default' = 'true'
);--> statement-breakpoint
INSERT INTO workspaces (id, name, slug, metadata, created_at, updated_at)
SELECT
  workspace_id,
  workspace_name,
  coalesce(nullif(trim(both '-' from left(regexp_replace(lower(workspace_name), '[^a-z0-9]+', '-', 'g'), 32)), ''), 'workspace') || '-' || substr(md5(random()::text || workspace_id::text), 1, 8),
  '{"default":true}',
  now(),
  now()
FROM _default_workspaces;--> statement-breakpoint
INSERT INTO members (id, role, user_id, workspace_id, created_at, updated_at)
SELECT
  encode(set_bit(set_bit(overlay(uuid_send(gen_random_uuid()) placing substring(int8send((extract(epoch from clock_timestamp()) * 1000)::bigint) from 3) from 1 for 6), 52, 1), 53, 1), 'hex')::uuid,
  'owner',
  user_id,
  workspace_id,
  now(),
  now()
FROM _default_workspaces;--> statement-breakpoint
UPDATE connections c
SET workspace_id = dw.workspace_id,
    updated_at = now()
FROM (
  SELECT DISTINCT ON (m.user_id) m.user_id, m.workspace_id
  FROM members m
  JOIN workspaces w ON w.id = m.workspace_id
  WHERE w.metadata IS NOT NULL
    AND w.metadata::jsonb ->> 'default' = 'true'
  ORDER BY m.user_id, m.created_at ASC
) dw
WHERE c.workspace_id IS NULL
  AND c.user_id = dw.user_id;--> statement-breakpoint
DROP TABLE _default_workspaces;--> statement-breakpoint
ALTER TABLE "connections" ALTER COLUMN "workspace_id" SET NOT NULL;
