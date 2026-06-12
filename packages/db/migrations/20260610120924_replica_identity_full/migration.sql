-- Custom SQL migration file, put your code below! --

-- Electric streams these tables to clients through shapes (apps/api/routers/shapes).
-- REPLICA IDENTITY FULL makes Postgres include the full *old* row in the logical
-- replication stream on UPDATE/DELETE, so Electric can detect rows that move out of
-- a shape's WHERE clause and tell clients to drop them. Without it, clients keep
-- stale rows. Keep this list in sync with the shapes router.
ALTER TABLE "connections" REPLICA IDENTITY FULL;
ALTER TABLE "connections_resources" REPLICA IDENTITY FULL;
ALTER TABLE "chats" REPLICA IDENTITY FULL;
ALTER TABLE "chats_messages" REPLICA IDENTITY FULL;
ALTER TABLE "queries" REPLICA IDENTITY FULL;
