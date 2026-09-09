import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import type { AnyFunction } from '@tamery/shared/utils/helpers'
import { Kysely } from 'kysely'
import { memoize } from 'memoza'

import { clickhouseColdDialect, clickhouseDialect } from './clickhouse'
import type { Database as ClickhouseDatabase } from './clickhouse/schema'
import type { DialectOptions } from './driver'
import { mssqlColdDialect, mssqlDialect } from './mssql'
import type { Database as MssqlDatabase } from './mssql/schema'
import { mysqlColdDialect, mysqlDialect } from './mysql'
import type { Database as MysqlDatabase } from './mysql/schema'
import { postgresColdDialect, postgresDialect } from './postgres'
import type { Database as PostgresDatabase } from './postgres/schema'

export const dialects = {
  clickhouse: memoize(
    (options: DialectOptions) =>
      new Kysely<ClickhouseDatabase>({ dialect: clickhouseDialect(options) })
  ),
  mssql: memoize(
    (options: DialectOptions) =>
      new Kysely<MssqlDatabase>({ dialect: mssqlDialect(options) })
  ),
  mysql: memoize(
    (options: DialectOptions) =>
      new Kysely<MysqlDatabase>({ dialect: mysqlDialect(options) })
  ),
  postgres: memoize(
    (options: DialectOptions) =>
      new Kysely<PostgresDatabase>({ dialect: postgresDialect(options) })
  ),
} satisfies Record<ConnectionType, AnyFunction>

export const coldDialects = {
  clickhouse: memoize(() => new Kysely({ dialect: clickhouseColdDialect() })),
  mssql: memoize(() => new Kysely({ dialect: mssqlColdDialect() })),
  mysql: memoize(() => new Kysely({ dialect: mysqlColdDialect() })),
  postgres: memoize(() => new Kysely({ dialect: postgresColdDialect() })),
} satisfies Record<ConnectionType, AnyFunction>
