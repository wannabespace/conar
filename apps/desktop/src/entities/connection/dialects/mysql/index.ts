import type { CompiledQuery, Dialect, Driver, QueryResult } from 'kysely'
import type { connections } from '~/drizzle'
import { DummyDriver, MysqlAdapter, MysqlQueryCompiler } from 'kysely'
import { logSql } from '../../sql'

function execute(connection: typeof connections.$inferSelect, compiledQuery: CompiledQuery) {
  if (!window.electron) {
    throw new Error('Electron is not available')
  }

  const promise = window.electron.query.mysql({
    connectionString: connection.connectionString,
    sql: compiledQuery.sql,
    values: compiledQuery.parameters as unknown[],
  })

  logSql(connection, promise, {
    sql: compiledQuery.sql,
    values: compiledQuery.parameters as unknown[],
  })

  return promise
}

function createDriver(connection: typeof connections.$inferSelect) {
  return {
    async init() {},
    async acquireConnection() {
      return {
        executeQuery: async <R>(compiledQuery: CompiledQuery): Promise<QueryResult<R>> => {
          const { result } = await execute(connection, compiledQuery)

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

export function mysqlDialect(connection: typeof connections.$inferSelect) {
  return {
    createDriver: () => createDriver(connection),
    createQueryCompiler: () => new MysqlQueryCompiler(),
    createAdapter: () => new MysqlAdapter(),
    createIntrospector: () => {
      throw new Error('Not implemented')
    },
  } satisfies Dialect
}

export function mysqlColdDialect() {
  return {
    createDriver: () => new DummyDriver(),
    createQueryCompiler: () => new MysqlQueryCompiler(),
    createAdapter: () => new MysqlAdapter(),
    createIntrospector: () => {
      throw new Error('Not implemented')
    },
  } satisfies Dialect
}
