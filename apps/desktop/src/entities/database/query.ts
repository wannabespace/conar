import type { DatabaseQueryResult } from '@conar/shared/databases'
import type { Type } from 'arktype'
import type { databases } from '~/drizzle'
import { DatabaseType } from '@conar/shared/enums/database-type'
import { Store } from '@tanstack/react-store'
// import { drizzle as mysqlProxy } from 'drizzle-orm/mysql-proxy'
import { drizzle as pgProxy } from 'drizzle-orm/pg-proxy'
import posthog from 'posthog-js'
import { formatSql } from '~/lib/formatter'
import { orpc } from '../../lib/orpc'

const queryFn = window.electron ? window.electron.databases.query : orpc.proxy.databases.query

export interface QueryLog {
  id: string
  query: string
  createdAt: Date
  values?: unknown[]
  result: DatabaseQueryResult | null
  label: string
  error: string | null
}

export const queriesLogStore = new Store<Record<string, Record<string, QueryLog>>>({})

const proxiesMap = {
  [DatabaseType.Postgres]: pgProxy,
  // [DatabaseType.MySQL]: mysqlProxy,
} satisfies Record<DatabaseType, unknown>

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
    result?: DatabaseQueryResult | null
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
    posthog.capture('database_query_error', {
      type: database.type,
      query,
      values,
      error,
    })
  }
}

export function drizzleProxy<T extends Record<string, unknown>>(database: typeof databases.$inferSelect, label?: string) {
  return proxiesMap[database.type]<T>(async (sql, params, method) => {
    const queryId = crypto.randomUUID()

    queryLog(database, queryId, {
      query: formatSql(sql, database.type)
        .split('\n')
        .filter(str => !str.startsWith('--'))
        .join(' '),
      values: params,
      result: null,
      error: null,
      label,
    })

    try {
      const result = await queryFn({
        type: database.type,
        connectionString: database.connectionString,
        // To prevent multiple queries
        sql: sql.replaceAll(';', ''),
        params,
        method,
      })

      queryLog(database, queryId, { result })

      return result
    }
    catch (error) {
      queryLog(database, queryId, { error: error instanceof Error ? error.message : String(error) })

      throw error
    }
  })
}

export function dbTestConnection(params: {
  type: DatabaseType
  connectionString: string
}) {
  const method = window.electron ? window.electron.databases.test : orpc.proxy.databases.test

  return method({
    type: params.type,
    connectionString: params.connectionString,
  })
}

type SqlRunnerQuery<T extends Type> = ({ db }: { db: ReturnType<typeof drizzleProxy> }) => Promise<T['in']['infer'][]>
type SqlRunnerQueryUnion<T extends Type> = SqlRunnerQuery<T> | Record<DatabaseType, SqlRunnerQuery<T>>

export async function runSql<T extends Type>(params: {
  type: T
  database: typeof databases.$inferSelect
  label: string
  query: SqlRunnerQueryUnion<T>
}): Promise<T['infer'][]>
export async function runSql<T extends Type>(params: {
  type?: T
  database: typeof databases.$inferSelect
  label: string
  query: SqlRunnerQueryUnion<T>
}): Promise<Record<string, unknown>[]>
export async function runSql<T extends Type>({
  type,
  database,
  label,
  query,
}: {
  type?: T
  database: typeof databases.$inferSelect
  label: string
  query: SqlRunnerQueryUnion<T>
}): Promise<T['infer'][] | Record<string, unknown>[]> {
  const queryFn = typeof query === 'function'
    ? query
    : query[database.type]

  const res = await queryFn({ db: drizzleProxy(database, label) })

  if (type) {
    return res.map(item => type.assert(item))
  }

  return res
}
