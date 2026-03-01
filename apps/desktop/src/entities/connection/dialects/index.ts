import type { ConnectionType } from '@conar/shared/enums/connection-type'
import type { Database as ClickhouseDatabase } from './clickhouse/schema'
import type { Database as MssqlDatabase } from './mssql/schema'
import type { Database as MysqlDatabase } from './mysql/schema'
import type { Database as PostgresDatabase } from './postgres/schema'
import type { connections } from '~/drizzle'
import { memoize } from '@conar/shared/utils/helpers'
import { DummyDriver, Kysely, MysqlAdapter, MysqlQueryCompiler } from 'kysely'
import { clickhouseColdDialect, clickhouseDialect } from './clickhouse'
import { mssqlColdDialect, mssqlDialect } from './mssql'
import { mysqlColdDialect, mysqlDialect } from './mysql'
import { postgresColdDialect, postgresDialect } from './postgres'

function redisColdDialect() {
  return {
    createDriver: () => new DummyDriver(),
    createQueryCompiler: () => new MysqlQueryCompiler(),
    createAdapter: () => new MysqlAdapter(),
    createIntrospector: () => {
      throw new Error('Not implemented')
    },
  }
}

const coldDialects = {
  postgres: postgresColdDialect,
  mysql: mysqlColdDialect,
  clickhouse: clickhouseColdDialect,
  mssql: mssqlColdDialect,
  redis: redisColdDialect,
} satisfies Record<ConnectionType, () => unknown>

export interface DialectOptions {
  silent?: boolean
}

export const dialects = {
  postgres: memoize((connection: typeof connections.$inferSelect, options?: DialectOptions) => new Kysely<PostgresDatabase>({ dialect: postgresDialect(connection, options) })),
  mysql: memoize((connection: typeof connections.$inferSelect, options?: DialectOptions) => new Kysely<MysqlDatabase>({ dialect: mysqlDialect(connection, options) })),
  clickhouse: memoize((connection: typeof connections.$inferSelect, options?: DialectOptions) => new Kysely<ClickhouseDatabase>({ dialect: clickhouseDialect(connection, options) })),
  mssql: memoize((connection: typeof connections.$inferSelect, options?: DialectOptions) => new Kysely<MssqlDatabase>({ dialect: mssqlDialect(connection, options) })),
  redis: memoize((connection: typeof connections.$inferSelect) => ({ connection, type: 'redis' as const })),
} satisfies Record<ConnectionType, (connection: typeof connections.$inferSelect) => unknown>

export function getColdDialect(dialect: ConnectionType) {
  return new Kysely<Record<string, Record<string, unknown>>>({ dialect: coldDialects[dialect]() })
}
