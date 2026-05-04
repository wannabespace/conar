import type { ConnectionType } from '@conar/shared/enums/connection-type'
import type { AnyFunction } from '@conar/shared/utils/helpers'
import type { CompiledQuery } from 'kysely'
import type { Database as ClickhouseDatabase } from './clickhouse/schema'
import type { Database as MssqlDatabase } from './mssql/schema'
import type { Database as MysqlDatabase } from './mysql/schema'
import type { Database as PostgresDatabase } from './postgres/schema'
import { memoize } from '@conar/memoize'
import { Kysely } from 'kysely'
import { clickhouseColdDialect, clickhouseDialect } from './clickhouse'
import { mssqlColdDialect, mssqlDialect } from './mssql'
import { mysqlColdDialect, mysqlDialect } from './mysql'
import { postgresColdDialect, postgresDialect } from './postgres'

export interface DialectOptions {
  connectionString: string
  connectionId?: string
  resourceId?: string
  log?: (params: {
    promise: Promise<{
      result: unknown
      duration: number
    }>
    query: string
    values?: unknown[]
  }) => void
}

export interface DialectExecutionOptions extends DialectOptions {
  compiledQuery: CompiledQuery
}

export const dialects = {
  postgres: memoize((options: DialectOptions) => new Kysely<PostgresDatabase>({ dialect: postgresDialect(options) }), {
    transformArgs: options => [options.connectionString, !!options.log],
  }),
  mysql: memoize((options: DialectOptions) => new Kysely<MysqlDatabase>({ dialect: mysqlDialect(options) }), {
    transformArgs: options => [options.connectionString, !!options.log],
  }),
  clickhouse: memoize((options: DialectOptions) => new Kysely<ClickhouseDatabase>({ dialect: clickhouseDialect(options) }), {
    transformArgs: options => [options.connectionString, !!options.log],
  }),
  mssql: memoize((options: DialectOptions) => new Kysely<MssqlDatabase>({ dialect: mssqlDialect(options) }), {
    transformArgs: options => [options.connectionString, !!options.log],
  }),
} satisfies Record<ConnectionType, AnyFunction>

export const coldDialects = {
  postgres: memoize(() => new Kysely({ dialect: postgresColdDialect() })),
  mysql: memoize(() => new Kysely({ dialect: mysqlColdDialect() })),
  clickhouse: memoize(() => new Kysely({ dialect: clickhouseColdDialect() })),
  mssql: memoize(() => new Kysely({ dialect: mssqlColdDialect() })),
} satisfies Record<ConnectionType, AnyFunction>
