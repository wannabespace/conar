import type { CompiledQuery, Dialect, Driver, QueryResult } from 'kysely'
import type { DialectOptions } from '..'
import type { connections } from '~/drizzle'
import { type } from 'arktype'
import { DummyDriver, MysqlQueryCompiler } from 'kysely'
import { logSql } from '../../sql'

function escapeSqlString(v: string) {
  return v.replace(/[\\']/g, '\\$&')
}

const dateStringType = type('string.date')

function prepareQuery(compiledQuery: CompiledQuery) {
  let i = 0
  const compiledSql = compiledQuery.sql.replace(/\?/g, () => {
    const param = compiledQuery.parameters[i++]

    if (param === null || param === undefined) {
      return 'NULL'
    }

    if (typeof param === 'number') {
      return `${param}`
    }

    if (param instanceof Date) {
      return `parseDateTime64BestEffort('${escapeSqlString(param.toISOString())}')`
    }

    if (typeof param !== 'string') {
      return `'${escapeSqlString(JSON.stringify(param))}'`
    }

    if (dateStringType.allows(param)) {
      return `parseDateTime64BestEffort('${escapeSqlString(param)}')`
    }

    return `'${escapeSqlString(param)}'`
  })

  return compiledSql.replace(
    /^update ((`\w+`\.)*`\w+`) set/i,
    'alter table $1 update',
  )
}

function execute(connection: typeof connections.$inferSelect, compiledQuery: CompiledQuery, options?: DialectOptions) {
  if (!window.electron) {
    throw new Error('Electron is not available')
  }

  const preparedQuery = prepareQuery(compiledQuery)

  const promise = window.electron.query.clickhouse({
    connectionString: connection.connectionString,
    sql: preparedQuery,
    silent: options?.silent,
  })

  logSql(connection, promise, { sql: preparedQuery })

  return promise
}

function createDriver(connection: typeof connections.$inferSelect, options?: DialectOptions) {
  return {
    async init() {},
    async acquireConnection() {
      return {
        executeQuery: async <R>(compiledQuery: CompiledQuery): Promise<QueryResult<R>> => {
          const { result } = await execute(connection, compiledQuery, options)

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

function clickhouseAdapter() {
  return {
    supportsCreateIfNotExists: false,
    supportsTransactionalDdl: false,
    supportsReturning: false,
    acquireMigrationLock: async () => {},
    releaseMigrationLock: async () => {},
  }
}

export function clickhouseDialect(connection: typeof connections.$inferSelect, options?: DialectOptions) {
  return {
    createAdapter: clickhouseAdapter,
    createDriver: () => createDriver(connection, options),
    createQueryCompiler: () => new MysqlQueryCompiler(),
    createIntrospector: () => {
      throw new Error('Not implemented')
    },
  } satisfies Dialect
}

export function clickhouseColdDialect() {
  return {
    createAdapter: clickhouseAdapter,
    createDriver: () => new DummyDriver(),
    createQueryCompiler: () => new MysqlQueryCompiler(),
    createIntrospector: () => {
      throw new Error('Not implemented')
    },
  } satisfies Dialect
}
