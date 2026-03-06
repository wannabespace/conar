import type { CompiledQuery, Dialect, Driver, QueryResult } from 'kysely'
import type { DialectOptions } from '..'
import { DummyDriver, SqliteAdapter, SqliteQueryCompiler } from 'kysely'

function execute(connectionString: string, compiledQuery: CompiledQuery, options?: DialectOptions) {
  if (!window.electron) {
    throw new Error('Electron is not available')
  }

  const values = [...compiledQuery.parameters]
  const promise = window.electron.query.sqlite({
    connectionString,
    sql: compiledQuery.sql,
    values,
    silent: options?.silent,
  })

  options?.log?.({ promise, query: compiledQuery.sql, values })

  return promise
}

function createDriver(options: DialectOptions) {
  return {
    async init() {},
    async acquireConnection() {
      return {
        executeQuery: async <R>(compiledQuery: CompiledQuery): Promise<QueryResult<R>> => {
          const { result } = await execute(options.connectionString, compiledQuery, options)
          return { rows: result as R[] }
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

export function sqliteDialect(options: DialectOptions) {
  return {
    createDriver: () => createDriver(options),
    createQueryCompiler: () => new SqliteQueryCompiler(),
    createAdapter: () => new SqliteAdapter(),
    createIntrospector: () => {
      throw new Error('Not implemented')
    },
  } satisfies Dialect
}

export function sqliteColdDialect() {
  return {
    createDriver: () => new DummyDriver(),
    createQueryCompiler: () => new SqliteQueryCompiler(),
    createAdapter: () => new SqliteAdapter(),
    createIntrospector: () => {
      throw new Error('Not implemented')
    },
  } satisfies Dialect
}
