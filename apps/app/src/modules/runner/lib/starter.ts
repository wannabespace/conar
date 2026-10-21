import { Dialect } from '@tamery/shared/enums/connection-type'
import { formatForDisplay } from '@tanstack/react-hotkeys'

import type { ShortcutId } from '~/core/keyboard/shortcuts'
import { SHORTCUTS } from '~/core/keyboard/shortcuts'

const keys = (shortcut: ShortcutId) =>
  SHORTCUTS[shortcut].hotkeys
    .map((hotkey) => formatForDisplay(hotkey))
    .join(' or ')

const STEP_BY_STEP =
  'Run BEGIN on its own to go step by step, then Commit or Rollback in the toolbar.'
const EXPLAIN = "Explain is in a statement's ⋯ menu."

const DIALECT_STARTERS: Record<
  Dialect,
  { examples: string[]; notes: string[] }
> = {
  [Dialect.ClickHouse]: {
    examples: [
      `-- Largest tables
SELECT
  table,
  formatReadableSize(sum(bytes_on_disk)) AS size,
  sum(rows) AS rows
FROM system.parts
WHERE active AND database = currentDatabase()
GROUP BY table
ORDER BY sum(bytes_on_disk) DESC
LIMIT 10;`,
      `-- Queries running right now
SELECT
  query_id,
  user,
  round(elapsed, 1) AS seconds,
  formatReadableSize(memory_usage) AS memory,
  query
FROM system.processes
ORDER BY elapsed DESC;`,
    ],
    notes: [
      'ClickHouse has no transactions, so each statement applies as it runs.',
    ],
  },
  [Dialect.MSSQL]: {
    examples: [
      `-- Largest tables
SELECT TOP 10
  SCHEMA_NAME(t.schema_id) AS schema_name,
  t.name AS table_name,
  SUM(CASE WHEN ps.index_id IN (0, 1) THEN ps.row_count ELSE 0 END) AS row_count,
  SUM(ps.used_page_count) * 8 / 1024 AS used_mb
FROM sys.dm_db_partition_stats AS ps
JOIN sys.tables AS t ON t.object_id = ps.object_id
GROUP BY t.schema_id, t.name
ORDER BY used_mb DESC;`,
      `-- Queries running right now
SELECT
  r.session_id,
  s.login_name,
  r.status,
  r.total_elapsed_time / 1000 AS seconds,
  r.blocking_session_id,
  q.text AS query
FROM sys.dm_exec_requests AS r
JOIN sys.dm_exec_sessions AS s ON s.session_id = r.session_id
CROSS APPLY sys.dm_exec_sql_text(r.sql_handle) AS q
WHERE r.session_id <> @@SPID
ORDER BY r.total_elapsed_time DESC;`,
    ],
    notes: [
      'Run BEGIN TRAN on its own to go step by step, then Commit or Rollback in the toolbar.',
    ],
  },
  [Dialect.MySQL]: {
    examples: [
      `-- Largest tables
SELECT
  TABLE_NAME,
  TABLE_ROWS,
  ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 1) AS size_mb
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
ORDER BY DATA_LENGTH + INDEX_LENGTH DESC
LIMIT 10;`,
      `-- Queries running right now
SELECT ID, USER, DB, TIME AS seconds, STATE, INFO AS query
FROM information_schema.PROCESSLIST
WHERE COMMAND <> 'Sleep' AND ID <> CONNECTION_ID()
ORDER BY TIME DESC;`,
    ],
    notes: [
      STEP_BY_STEP,
      'Schema changes commit right away, even inside a transaction.',
      EXPLAIN,
    ],
  },
  [Dialect.Oracle]: {
    examples: [
      `-- Largest tables
SELECT
  SEGMENT_NAME AS TABLE_NAME,
  ROUND(SUM(BYTES) / 1024 / 1024, 1) AS SIZE_MB
FROM USER_SEGMENTS
WHERE SEGMENT_TYPE LIKE 'TABLE%'
GROUP BY SEGMENT_NAME
ORDER BY SIZE_MB DESC
FETCH FIRST 10 ROWS ONLY;`,
      `-- Objects that failed to compile
SELECT OBJECT_TYPE, OBJECT_NAME, LAST_DDL_TIME
FROM USER_OBJECTS
WHERE STATUS = 'INVALID'
ORDER BY OBJECT_TYPE, OBJECT_NAME;`,
    ],
    notes: [
      'Each statement commits as it runs. BEGIN starts a PL/SQL block,',
      'so put statements in one BEGIN ... END; block to run them together.',
    ],
  },
  [Dialect.Postgres]: {
    examples: [
      `-- Largest tables
SELECT
  schemaname,
  relname AS table_name,
  n_live_tup AS rows,
  pg_size_pretty(pg_total_relation_size(relid)) AS total_size
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(relid) DESC
LIMIT 10;`,
      `-- Queries running right now
SELECT
  pid,
  usename,
  state,
  now() - query_start AS duration,
  wait_event_type,
  query
FROM pg_stat_activity
WHERE state <> 'idle' AND pid <> pg_backend_pid()
ORDER BY duration DESC;`,
    ],
    notes: [STEP_BY_STEP, EXPLAIN],
  },
  [Dialect.SQLite]: {
    examples: [
      `-- Every column of every table
SELECT t.name AS table_name, c.name AS column_name, c.type, c.pk, c."notnull"
FROM pragma_table_list() AS t
JOIN pragma_table_info(t.name) AS c
WHERE t.schema = 'main'
  AND t.type = 'table'
  AND substr(t.name, 1, 7) != 'sqlite_'
  AND substr(t.name, 1, 4) != '_cf_'
ORDER BY t.name, c.cid;`,
      `-- Rows that break a foreign key
PRAGMA foreign_key_check;`,
    ],
    notes: [
      STEP_BY_STEP,
      'Turso and D1 need the whole BEGIN ... COMMIT block in one Run all.',
    ],
  },
}

export const starterQuery = (dialect: Dialect) => {
  const { examples, notes } = DIALECT_STARTERS[dialect]
  const comments = [
    `${keys('runStatement')} runs the statement under the caret, or the selection.`,
    `${keys('runAll')} runs every statement in this tab.`,
    `${keys('saveStatement')} saves the statement as a query, ${keys('saveTab')} the whole tab.`,
    `${keys('editWithAi')} edits with AI, ${keys('fixWithAi')} fixes a statement that failed.`,
    'Tamery asks before running UPDATE, DELETE, DROP or ALTER.',
    ...notes,
  ].map((line) => `-- ${line}`)
  return `${[comments.join('\n'), ...examples].join('\n\n')}\n`
}
