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

const DIALECT_NOTES: Record<Dialect, string[]> = {
  [Dialect.ClickHouse]: [
    'ClickHouse has no transactions, so each statement applies as it runs.',
  ],
  [Dialect.MSSQL]: [
    'Run BEGIN TRAN on its own to go step by step, then Commit or Rollback in the toolbar.',
  ],
  [Dialect.MySQL]: [
    STEP_BY_STEP,
    'Schema changes commit right away, even inside a transaction.',
    EXPLAIN,
  ],
  [Dialect.Oracle]: [
    'Each statement commits as it runs. BEGIN starts a PL/SQL block,',
    'so put statements in one BEGIN ... END; block to run them together.',
  ],
  [Dialect.Postgres]: [STEP_BY_STEP, EXPLAIN],
  [Dialect.SQLite]: [
    STEP_BY_STEP,
    'Turso and D1 need the whole BEGIN ... COMMIT block in one Run all.',
  ],
}

export const starterQuery = (dialect: Dialect) =>
  `${[
    `${keys('runStatement')} runs the statement under the caret, or the selection.`,
    `${keys('runAll')} runs every statement in this tab.`,
    `${keys('saveStatement')} saves the statement as a query, ${keys('saveTab')} the whole tab.`,
    `${keys('editWithAi')} edits with AI, ${keys('fixWithAi')} fixes a statement that failed.`,
    'Tamery asks before running UPDATE, DELETE, DROP or ALTER.',
    ...DIALECT_NOTES[dialect],
  ]
    .map((line) => `-- ${line}`)
    .join('\n')}\n\n`
