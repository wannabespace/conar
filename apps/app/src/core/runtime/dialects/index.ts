import type { Dialect } from '@tamery/shared/enums/connection-type'
import type { AnyFunction } from '@tamery/shared/utils'
import { Kysely } from 'kysely'
import { memoize } from 'memoza'

import { clickhouseColdDialect, clickhouseDialect } from './clickhouse'
import type { Database as ClickhouseDatabase } from './clickhouse/schema'
import type { DialectOptions } from './driver'
import { mssqlColdDialect, mssqlDialect } from './mssql'
import type { Database as MssqlDatabase } from './mssql/schema'
import { mysqlColdDialect, mysqlDialect } from './mysql'
import type { Database as MysqlDatabase } from './mysql/schema'
import { oracleColdDialect, oracleDialect } from './oracle'
import type { Database as OracleDatabase } from './oracle/schema'
import { postgresColdDialect, postgresDialect } from './postgres'
import type { Database as PostgresDatabase } from './postgres/schema'
import { sqliteColdDialect, sqliteDialect } from './sqlite'
import type { Database as SqliteDatabase } from './sqlite/schema'

export const dialects = {
  clickhouse: memoize(
    (options: DialectOptions) =>
      new Kysely<ClickhouseDatabase>({ dialect: clickhouseDialect(options) }),
    { cacheKey: ({ log: _log, ...rest }) => rest }
  ),
  mssql: memoize(
    (options: DialectOptions) =>
      new Kysely<MssqlDatabase>({ dialect: mssqlDialect(options) }),
    { cacheKey: ({ log: _log, ...rest }) => rest }
  ),
  mysql: memoize(
    (options: DialectOptions) =>
      new Kysely<MysqlDatabase>({ dialect: mysqlDialect(options) }),
    { cacheKey: ({ log: _log, ...rest }) => rest }
  ),
  oracle: memoize(
    (options: DialectOptions) =>
      new Kysely<OracleDatabase>({ dialect: oracleDialect(options) }),
    { cacheKey: ({ log: _log, ...rest }) => rest }
  ),
  postgres: memoize(
    (options: DialectOptions) =>
      new Kysely<PostgresDatabase>({ dialect: postgresDialect(options) }),
    { cacheKey: ({ log: _log, ...rest }) => rest }
  ),
  sqlite: memoize(
    (options: DialectOptions) =>
      new Kysely<SqliteDatabase>({ dialect: sqliteDialect(options) }),
    { cacheKey: ({ log: _log, ...rest }) => rest }
  ),
} satisfies Record<Dialect, AnyFunction>

export const coldDialects = {
  clickhouse: memoize(() => new Kysely({ dialect: clickhouseColdDialect() })),
  mssql: memoize(() => new Kysely({ dialect: mssqlColdDialect() })),
  mysql: memoize(() => new Kysely({ dialect: mysqlColdDialect() })),
  oracle: memoize(() => new Kysely({ dialect: oracleColdDialect() })),
  postgres: memoize(() => new Kysely({ dialect: postgresColdDialect() })),
  sqlite: memoize(() => new Kysely({ dialect: sqliteColdDialect() })),
} satisfies Record<Dialect, AnyFunction>
