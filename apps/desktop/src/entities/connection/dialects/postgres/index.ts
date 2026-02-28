import type { CompiledQuery, Dialect, Driver, QueryResult } from 'kysely'
import type { DialectOptions } from '..'
import type { connections } from '~/drizzle'
import { getPostgresQueryKey, isPostgresLikeConnection } from '@conar/shared/utils/connections'
import { DummyDriver, PostgresAdapter, PostgresQueryCompiler } from 'kysely'
import { logSql } from '../../sql'

function toValuesArray(parameters: ReadonlyArray<unknown>): unknown[] {
  return Array.from(parameters)
}

function toRowArray(value: unknown): unknown[] {
  if (!Array.isArray(value)) {
    throw new TypeError('Query result must be an array of rows')
  }
  return value
}

function execute(connection: typeof connections.$inferSelect, compiledQuery: CompiledQuery, options?: DialectOptions) {
  if (!window.electron) {
    throw new Error('Electron is not available')
  }
  if (!isPostgresLikeConnection(connection.type)) {
    throw new Error(`Postgres dialect requires postgres or supabase connection, got ${connection.type}`)
  }
  const queryKey = getPostgresQueryKey(connection.type)
  const values = toValuesArray(compiledQuery.parameters)
  const promise = window.electron.query[queryKey]({
    connectionString: connection.connectionString,
    sql: compiledQuery.sql,
    values,
    silent: options?.silent,
  })

  logSql(connection, promise, {
    sql: compiledQuery.sql,
    values,
  })

  return promise
}

function createDriver(connection: typeof connections.$inferSelect, options?: DialectOptions) {
  return {
    async init() {},
    async acquireConnection() {
      return {
        executeQuery: async <R>(compiledQuery: CompiledQuery): Promise<QueryResult<R>> => {
          const { result } = await execute(connection, compiledQuery, options)
          const rows = toRowArray(result)
          return { rows: rows as R[] }
        },
        streamQuery() {
          throw new Error('Not implemented')
        },
      }
    },
    async beginTransaction() {},
    async commitTransaction() {},
    async rollbackTransaction() {},
    async releaseConnection() {},
    async destroy() {},
  } satisfies Driver
}

export function postgresDialect(connection: typeof connections.$inferSelect, options?: DialectOptions) {
  return {
    createDriver: () => createDriver(connection, options),
    createQueryCompiler: () => new PostgresQueryCompiler(),
    createAdapter: () => new PostgresAdapter(),
    createIntrospector: () => {
      throw new Error('Not implemented')
    },
  } satisfies Dialect
}

export function postgresColdDialect() {
  return {
    createDriver: () => new DummyDriver(),
    createQueryCompiler: () => new PostgresQueryCompiler(),
    createAdapter: () => new PostgresAdapter(),
    createIntrospector: () => {
      throw new Error('Not implemented')
    },
  } satisfies Dialect
}
