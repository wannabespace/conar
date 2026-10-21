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
      'SELECT version();',
      `SELECT name, engine
FROM system.tables
WHERE database = currentDatabase()
ORDER BY name;`,
    ],
    notes: [
      'ClickHouse has no transactions, so each statement applies as it runs.',
    ],
  },
  [Dialect.MSSQL]: {
    examples: [
      'SELECT @@VERSION;',
      `SELECT TABLE_SCHEMA, TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
ORDER BY TABLE_SCHEMA, TABLE_NAME;`,
    ],
    notes: [
      'Run BEGIN TRAN on its own to go step by step, then Commit or Rollback in the toolbar.',
    ],
  },
  [Dialect.MySQL]: {
    examples: [
      'SELECT VERSION();',
      `SELECT TABLE_NAME, TABLE_ROWS
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
ORDER BY TABLE_NAME;`,
    ],
    notes: [
      STEP_BY_STEP,
      'Schema changes commit right away, even inside a transaction.',
      EXPLAIN,
    ],
  },
  [Dialect.Oracle]: {
    examples: [
      'SELECT PRODUCT, VERSION FROM PRODUCT_COMPONENT_VERSION;',
      'SELECT TABLE_NAME, NUM_ROWS FROM USER_TABLES ORDER BY TABLE_NAME;',
    ],
    notes: [
      'Each statement commits as it runs. BEGIN starts a PL/SQL block,',
      'so put statements in one BEGIN ... END; block to run them together.',
    ],
  },
  [Dialect.Postgres]: {
    examples: [
      'SELECT version();',
      `SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY table_schema, table_name;`,
    ],
    notes: [STEP_BY_STEP, EXPLAIN],
  },
  [Dialect.SQLite]: {
    examples: [
      'SELECT sqlite_version();',
      `SELECT name, type
FROM pragma_table_list()
WHERE schema = 'main'
  AND substr(name, 1, 7) != 'sqlite_'
  AND substr(name, 1, 4) != '_cf_'
ORDER BY name;`,
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
