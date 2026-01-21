import type { ConnectionType } from '@conar/shared/enums/connection-type'
import type { Database as ClickhouseDatabase } from './clickhouse/schema'
import type { Database as MssqlDatabase } from './mssql/schema'
import type { Database as MysqlDatabase } from './mysql/schema'
import type { Database as PostgresDatabase } from './postgres/schema'
import type { Database as SqliteDatabase } from './sqlite/schema'
import type { connections } from '~/drizzle'
import { memoize } from '@conar/shared/utils/helpers'
import { Kysely } from 'kysely'
import { clickhouseDialect } from './clickhouse'
import { mssqlDialect } from './mssql'
import { mysqlDialect } from './mysql'
import { postgresDialect } from './postgres'
import { sqliteDialect } from './sqlite'

export const dialects = {
  postgres: memoize((connection: typeof connections.$inferSelect) => new Kysely<PostgresDatabase>({ dialect: postgresDialect(connection) })),
  mysql: memoize((connection: typeof connections.$inferSelect) => new Kysely<MysqlDatabase>({ dialect: mysqlDialect(connection) })),
  clickhouse: memoize((connection: typeof connections.$inferSelect) => new Kysely<ClickhouseDatabase>({ dialect: clickhouseDialect(connection) })),
  mssql: memoize((connection: typeof connections.$inferSelect) => new Kysely<MssqlDatabase>({ dialect: mssqlDialect(connection) })),
  sqlite: memoize((connection: typeof connections.$inferSelect) => new Kysely<SqliteDatabase>({ dialect: sqliteDialect(connection) })),
} satisfies Record<ConnectionType, (connection: typeof connections.$inferSelect) => unknown>
