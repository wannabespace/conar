import type { DatabaseType } from '@conar/shared/enums/database-type'
import type { databases } from '~/drizzle'
import { Store } from '@tanstack/react-store'
import { formatSql } from '~/lib/formatter'

export * from './constraints'
export * from './delete-rows'
export * from './drop-table'
export * from './enums'
export * from './indexes'
export * from './rename-table'
export * from './rows'
export * from './select'
export * from './set'
export * from './tables-and-schemas'
export * from './total'

export function executeSql({
  type,
  connectionString,
  sql,
  values = [],
}: {
  type: DatabaseType
  connectionString: string
  sql: string
  values?: unknown[]
}) {
  if (!window.electron) {
    throw new Error('Electron is not available')
  }

  return window.electron.query[type]({ connectionString, sql, values })
}

export function executeAndLogSql({ database, sql, values = [] }: {
  database: typeof databases.$inferSelect
  sql: string
  values?: unknown[]
}) {
  const promise = executeSql({ type: database.type, connectionString: database.connectionString, sql, values })

  logSql(database, promise, { sql, values })

  return promise
}

export interface SqlLog {
  id: string
  sql: string
  createdAt: Date
  result: unknown | null
  duration: number | null
  values: unknown[]
  error: string | null
}

export const sqlLogsStore = new Store<Record<string, Record<string, SqlLog>>>({})

export async function logSql(
  database: typeof databases.$inferSelect,
  promise: Promise<{ result: unknown, duration: number }>,
  {
    sql,
    values = [],
  }: {
    sql: string
    values?: unknown[]
  },
) {
  const id = crypto.randomUUID()

  sqlLogsStore.setState(state => ({
    ...state,
    [database.id]: {
      ...(state[database.id] || {}),
      [id]: {
        id,
        createdAt: new Date(),
        sql: formatSql(sql, database.type)
          .split('\n')
          .filter(str => !str.startsWith('--'))
          .join(' '),
        values,
        result: null,
        duration: null,
        error: null,
      },
    },
  } satisfies typeof state))

  try {
    const { result, duration } = await promise

    sqlLogsStore.setState(state => ({
      ...state,
      [database.id]: {
        ...state[database.id],
        [id]: {
          ...state[database.id]![id]!,
          result,
          duration,
        },
      },
    } satisfies typeof state))
  }
  catch (error) {
    sqlLogsStore.setState(state => ({
      ...state,
      [database.id]: {
        ...state[database.id],
        [id]: {
          ...state[database.id]![id]!,
          error: error instanceof Error ? error.message : String(error),
        },
      },
    } satisfies typeof state))
  }
}
