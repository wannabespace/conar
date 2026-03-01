import type { CompiledQuery, Dialect, Driver, QueryResult } from 'kysely'
import type { DialectExecutionOptions, DialectOptions } from '..'
import { DummyDriver, PostgresAdapter, PostgresQueryCompiler } from 'kysely'

function execute(options: DialectExecutionOptions) {
  if (!window.electron) {
    throw new Error('Electron is not available')
  }

  const promise = window.electron.query.postgres({
    connectionString: options.connectionString,
    query: options.compiledQuery.sql,
    values: options.compiledQuery.parameters as unknown[],
    silent: options.silent,
  })

  options.log?.({ promise, query: options.compiledQuery.sql, values: options.compiledQuery.parameters as unknown[] })

  return promise
}

function createDriver(options: DialectOptions) {
  return {
    async init() {},
    async acquireConnection() {
      return {
        executeQuery: async <R>(compiledQuery: CompiledQuery): Promise<QueryResult<R>> => {
          const { result } = await execute({ ...options, compiledQuery })

          return {
            rows: result as R[],
          }
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

export function postgresDialect(options: DialectOptions) {
  return {
    createDriver: () => createDriver(options),
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
