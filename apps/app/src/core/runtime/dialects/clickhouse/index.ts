import { ConnectionType } from '@tamery/shared/enums/connection-type'
import type { CompiledQuery, Dialect } from 'kysely'
import { DummyDriver, MysqlQueryCompiler } from 'kysely'

import type { DialectOptions } from '~/core/runtime/dialects/driver'
import { createKyselyDriver } from '~/core/runtime/dialects/driver'

const escapeSqlStringRegex = /[\\']/gu

const escapeSqlString = (v: string) => v.replace(escapeSqlStringRegex, '\\$&')

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

export const prepareQuery = (compiledQuery: CompiledQuery) => {
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

    return `'${escapeSqlString(typeof param === 'string' ? param : JSON.stringify(param))}'`
  })

  const mutation = compiledSql.replace(
    compiledSqlParameterRegex,
    'alter table $<table> update'
  )
  // A mutation runs in the background by default, so the refresh right after a save would read the old row.
  return mutation === compiledSql
    ? compiledSql
    : `${mutation} settings mutations_sync = 1`
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
      createKyselyDriver(
        ConnectionType.ClickHouse,
        options,
        (compiledQuery) => ({
          query: prepareQuery(compiledQuery),
          values: [],
        })
      ),
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
