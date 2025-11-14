import type { DatabaseType } from '@conar/shared/enums/database-type'
import type { MysqlDatabase, PostgresDatabase } from './schemas'
import type { databases } from '~/drizzle'
import { getErrorMessage } from '@conar/shared/utils/error'
import { Store } from '@tanstack/react-store'
import { Kysely } from 'kysely'
import { formatSql } from '~/lib/formatter'
import { DummyMysqlDialect, DummyPostgresDialect } from './dialects'

export interface QueryLog {
  id: string
  query: string
  createdAt: Date
  values?: unknown[]
  result: Record<string, unknown>[] | null
  label: string
  error: string | null
}

export const queriesLogStore = new Store<Record<string, Record<string, QueryLog>>>({})

function queryLog(
  database: typeof databases.$inferSelect,
  id: string,
  {
    query,
    values,
    result,
    error,
    label,
  }: {
    query?: string
    values?: unknown[]
    result?: Record<string, unknown>[] | null
    error?: string | null
    label?: string
  },
) {
  const log = queriesLogStore.state[database.id]?.[id]

  queriesLogStore.setState(state => ({
    ...state,
    [database.id]: {
      ...(state[database.id] || {}),
      [id]: {
        id,
        createdAt: log?.createdAt || new Date(),
        query: query || log?.query || '',
        values: values || log?.values || [],
        result: result || log?.result || null,
        error: error || log?.error || null,
        label: label || log?.label || '',
      },
    },
  } satisfies typeof state))

  if (error) {
    console.error('db query error', database.type, query, values, error)
  }
}

export function executeSql({ sql, values = [], type, connectionString }: { sql: string, values?: unknown[], type: DatabaseType, connectionString: string }) {
  if (!window.electron) {
    throw new Error('Electron is not available')
  }
  return window.electron.sql({ sql, values, type, connectionString })
}

const dialectsMap = {
  postgres: () => new Kysely<PostgresDatabase>({
    dialect: new DummyPostgresDialect(),
    log: ['query', 'error'],
  }),
  mysql: () => new Kysely<MysqlDatabase>({
    dialect: new DummyMysqlDialect(),
    log: ['query', 'error'],
  }),
} satisfies Record<DatabaseType, () => unknown>

export async function runSql<T extends object = Record<string, unknown>>({
  validate,
  label,
  database,
  query: queryFn,
}: {
  validate?: (result: unknown) => T
  label: string
  database: typeof databases.$inferSelect
  query: {
    [D in DatabaseType]: (db: ReturnType<typeof dialectsMap[D]>) => { sql: string, parameters: readonly unknown[] }
  }
}) {
  const dialect = dialectsMap[database.type]()
  // eslint-disable-next-line ts/no-explicit-any
  const query = queryFn[database.type](dialect as any)
  const queryId = crypto.randomUUID()

  queryLog(database, queryId, {
    query: formatSql(query.sql, database.type)
      .split('\n')
      .filter(str => !str.startsWith('--'))
      .join(' '),
    values: query.parameters as unknown[],
    result: null,
    error: null,
    label,
  })

  try {
    if (!window.electron) {
      throw new Error('Electron is not available')
    }

    const { result, duration } = await window.electron.sql({
      sql: query.sql,
      values: query.parameters as unknown[],
      type: database.type,
      connectionString: database.connectionString,
    })

    queryLog(database, queryId, { result })

    return {
      result: (validate ? result.map(row => validate(row)) : result) as T[],
      duration,
    }
  }
  catch (error) {
    queryLog(database, queryId, { error: getErrorMessage(error) })

    throw error
  }
}
