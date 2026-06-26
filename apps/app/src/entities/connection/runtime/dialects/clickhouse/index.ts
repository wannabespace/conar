import type { CompiledQuery, Dialect } from 'kysely'
import type { DialectOptions } from '..'
import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { type } from 'arktype'
import { DummyDriver, MysqlQueryCompiler } from 'kysely'
import { createDialectProvider, createKyselyDriver } from '..'

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
    createDriver: () => createKyselyDriver({
      provider: createDialectProvider(ConnectionType.ClickHouse, options),
      logger: options.log,
      transformQuery: compiledQuery => ({ query: prepareQuery(compiledQuery), values: [] }),
    }),
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
