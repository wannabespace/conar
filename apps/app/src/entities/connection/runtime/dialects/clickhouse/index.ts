import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { type } from 'arktype'
import type { CompiledQuery, Dialect } from 'kysely'
import { DummyDriver, MysqlQueryCompiler } from 'kysely'

import type { DialectOptions } from '..'
import { createDialectProvider, createKyselyDriver } from '..'

const escapeSqlStringRegex = /[\\']/gu

const escapeSqlString = (v: string) => v.replace(escapeSqlStringRegex, '\\$&')

const dateStringType = type('string.date')

const compiledSqlRegex = /\?/gu
const compiledSqlParameterRegex = /^update (?<table>(?:`\w+`\.)*`\w+`) set/iu

const formatArrayValue = (value: unknown) => {
  if (value === null || value === undefined) {
    return 'NULL'
  }
  if (typeof value === 'number') {
    return `${value}`
  }
  return `'${escapeSqlString(String(value))}'`
}

const prepareQuery = (compiledQuery: CompiledQuery) => {
  let i = 0
  const compiledSql = compiledQuery.sql.replace(compiledSqlRegex, () => {
    const param = compiledQuery.parameters[i]
    i += 1

    if (param === null || param === undefined) {
      return 'NULL'
    }

    if (Array.isArray(param)) {
      return `[${param.map(formatArrayValue).join(', ')}]`
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
    'alter table $<table> update'
  )
}

const clickhouseAdapter = () => ({
  acquireMigrationLock: () => Promise.resolve(),
  releaseMigrationLock: () => Promise.resolve(),
  supportsCreateIfNotExists: false,
  supportsReturning: false,
  supportsTransactionalDdl: false,
})

export const clickhouseDialect = (options: DialectOptions) =>
  ({
    createAdapter: clickhouseAdapter,
    createDriver: () =>
      createKyselyDriver({
        logger: options.log,
        provider: createDialectProvider(ConnectionType.ClickHouse, options),
        transformQuery: (compiledQuery) => ({
          query: prepareQuery(compiledQuery),
          values: [],
        }),
      }),
    createIntrospector: () => {
      throw new Error('Not implemented')
    },
    createQueryCompiler: () => new MysqlQueryCompiler(),
  }) satisfies Dialect

export const clickhouseColdDialect = () =>
  ({
    createAdapter: clickhouseAdapter,
    createDriver: () => new DummyDriver(),
    createIntrospector: () => {
      throw new Error('Not implemented')
    },
    createQueryCompiler: () => new MysqlQueryCompiler(),
  }) satisfies Dialect
