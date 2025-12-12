import type { CompiledQuery, Dialect, Driver, QueryResult } from 'kysely'
import type { databases } from '~/drizzle'
import { MysqlAdapter, MysqlQueryCompiler } from 'kysely'
import { logSql } from '../../sql'

function execute(database: typeof databases.$inferSelect, compiledQuery: CompiledQuery) {
  if (!window.electron) {
    throw new Error('Electron is not available')
  }

  const promise = window.electron.query.mysql({
    connectionString: database.connectionString,
    sql: compiledQuery.sql,
    values: compiledQuery.parameters as unknown[],
  })

  logSql(database, promise, {
    sql: compiledQuery.sql,
    values: compiledQuery.parameters as unknown[],
  })

  return promise
}

function createDriver(database: typeof databases.$inferSelect) {
  return {
    async init() {},
    async acquireConnection() {
      return {
        executeQuery: async <R>(compiledQuery: CompiledQuery): Promise<QueryResult<R>> => {
          const { result } = await execute(database, compiledQuery)

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

export function mysqlDialect(database: typeof databases.$inferSelect) {
  return {
    createDriver: () => createDriver(database),
    createQueryCompiler: () => new MysqlQueryCompiler(),
    createAdapter: () => new MysqlAdapter(),
    createIntrospector: () => {
      throw new Error('Not implemented')
    },
  } satisfies Dialect
}
