import type { CompiledQuery, Dialect, Driver, QueryResult } from 'kysely'
import type { DialectExecutionOptions, DialectOptions } from '..'
import { type } from 'arktype'
import { DummyDriver, MysqlQueryCompiler } from 'kysely'

const escapeSqlStringRegex = /[\\']/g

function escapeSqlString(v: string) {
  return v.replace(escapeSqlStringRegex, '\\$&')
}

const dateStringType = type('string.date')

const compiledSqlRegex = /\?/g
const compiledSqlParameterRegex = /^update ((`\w+`\.)*`\w+`) set/i

function prepareQuery(compiledQuery: CompiledQuery) {
  let i = 0
  const compiledSql = compiledQuery.sql.replace(compiledSqlRegex, () => {
    const param = compiledQuery.parameters[i++]

    if (param === null || param === undefined) {
      return 'NULL'
    }

    if (Array.isArray(param)) {
      return `[${param.map(v =>
        v === null || v === undefined
          ? 'NULL'
          : typeof v === 'number'
            ? `${v}`
            : `'${escapeSqlString(String(v))}'`,
      ).join(', ')}]`
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
    compiledSqlParameterRegex,
    'alter table $1 update',
  )
}

function execute(options: DialectExecutionOptions) {
  if (!window.electron) {
    throw new Error('Electron is not available')
  }

  const preparedQuery = prepareQuery(options.compiledQuery)

  const promise = window.electron.query.clickhouse({
    connectionString: options.connectionString,
    query: preparedQuery,
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

function clickhouseAdapter() {
  return {
    supportsCreateIfNotExists: false,
    supportsTransactionalDdl: false,
    supportsReturning: false,
    acquireMigrationLock: async () => {},
    releaseMigrationLock: async () => {},
  }
}

export function clickhouseDialect(options: DialectOptions) {
  return {
    createAdapter: clickhouseAdapter,
    createDriver: () => createDriver(options),
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
