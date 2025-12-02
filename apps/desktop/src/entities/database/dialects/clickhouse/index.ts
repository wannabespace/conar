import type { CompiledQuery, Dialect, Driver, QueryResult } from 'kysely'
import type { databases } from '~/drizzle'
import { MysqlQueryCompiler } from 'kysely'
import { logSql } from '../../sql'

function prepareQuery(compiledQuery: CompiledQuery) {
  let i = 0
  const compiledSql = compiledQuery.sql.replace(/\?/g, () => {
    const param = compiledQuery.parameters[i++]

    if (typeof param === 'number') {
      return `${param}`
    }

    if (typeof param !== 'string') {
      return `'${JSON.stringify(param)}'`
    }

    return `'${param.replace(/'/g, `\\'`).replace(/\\"/g, '\\\\"')}'`
  })

  return compiledSql.replace(
    /^update ((`\w+`\.)*`\w+`) set/i,
    'alter table $1 update',
  )
}

function execute(database: typeof databases.$inferSelect, compiledQuery: CompiledQuery) {
  if (!window.electron) {
    throw new Error('Electron is not available')
  }

  const preparedQuery = prepareQuery(compiledQuery)

  const promise = window.electron.query.clickhouse({
    connectionString: database.connectionString,
    sql: preparedQuery,
  })

  logSql(database, promise, { sql: preparedQuery })

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

export function clickhouseDialect(database: typeof databases.$inferSelect) {
  return {
    createAdapter: () => ({
      supportsCreateIfNotExists: false,
      supportsTransactionalDdl: false,
      supportsReturning: false,
      acquireMigrationLock: async () => {},
      releaseMigrationLock: async () => {},
    }),
    createDriver: () => createDriver(database),
    createQueryCompiler: () => new MysqlQueryCompiler(),
    createIntrospector: () => {
      throw new Error('Not implemented')
    },
  } satisfies Dialect
}
