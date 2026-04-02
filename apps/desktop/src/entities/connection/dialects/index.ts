import type { ConnectionType } from '@conar/shared/enums/connection-type'
import type { CompiledQuery } from 'kysely'
import type { Database as ClickhouseDatabase } from './clickhouse/schema'
import type { Database as DuckDBDatabase } from './duckdb/schema'
import type { Database as MssqlDatabase } from './mssql/schema'
import type { Database as MysqlDatabase } from './mysql/schema'
import type { Database as PostgresDatabase } from './postgres/schema'
import { memoize } from '@conar/shared/utils/helpers'
import { Kysely } from 'kysely'
import { clickhouseColdDialect, clickhouseDialect } from './clickhouse'
import { duckdbColdDialect, duckdbDialect } from './duckdb'
import { mssqlColdDialect, mssqlDialect } from './mssql'
import { mysqlColdDialect, mysqlDialect } from './mysql'
import { postgresColdDialect, postgresDialect } from './postgres'

export interface DialectOptions {
  connectionString: string
  log?: (params: {
    promise: Promise<{
      result: unknown
      duration: number
    }>
    query: string
    values?: unknown[]
  }) => void
  silent?: boolean
}

export interface DialectExecutionOptions extends DialectOptions {
  compiledQuery: CompiledQuery
}

export const dialects = {
  postgres: memoize((options: DialectOptions) => new Kysely<PostgresDatabase>({ dialect: postgresDialect(options) })),
  mysql: memoize((options: DialectOptions) => new Kysely<MysqlDatabase>({ dialect: mysqlDialect(options) })),
  clickhouse: memoize((options: DialectOptions) => new Kysely<ClickhouseDatabase>({ dialect: clickhouseDialect(options) })),
  mssql: memoize((options: DialectOptions) => new Kysely<MssqlDatabase>({ dialect: mssqlDialect(options) })),
  duckdb: memoize((options: DialectOptions) => new Kysely<DuckDBDatabase>({ dialect: duckdbDialect(options) })),
} satisfies Record<ConnectionType, (options: DialectOptions) => unknown>

export const coldDialects = {
  postgres: memoize(() => new Kysely({ dialect: postgresColdDialect() })),
  mysql: memoize(() => new Kysely({ dialect: mysqlColdDialect() })),
  clickhouse: memoize(() => new Kysely({ dialect: clickhouseColdDialect() })),
  mssql: memoize(() => new Kysely({ dialect: mssqlColdDialect() })),
  duckdb: memoize(() => new Kysely({ dialect: duckdbColdDialect() })),
} satisfies Record<ConnectionType, () => Kysely<Record<string, Record<string, unknown>>>>
