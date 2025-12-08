import type { DatabaseType } from '@conar/shared/enums/database-type'
import type { Database as ClickhouseDatabase } from './clickhouse/schema'
import type { Database as MysqlDatabase } from './mysql/schema'
import type { Database as PostgresDatabase } from './postgres/schema'
import type { Database as SqliteDatabase } from './sqlite/schema'
import type { databases } from '~/drizzle'
import { memoize } from '@conar/shared/utils/helpers'
import { Kysely } from 'kysely'
import { clickhouseDialect } from './clickhouse'
import { mysqlDialect } from './mysql'
import { postgresDialect } from './postgres'
import { sqliteDialect } from './sqlite'

export const dialects = {
  postgres: memoize((database: typeof databases.$inferSelect) => new Kysely<PostgresDatabase>({ dialect: postgresDialect(database) })),
  mysql: memoize((database: typeof databases.$inferSelect) => new Kysely<MysqlDatabase>({ dialect: mysqlDialect(database) })),
  clickhouse: memoize((database: typeof databases.$inferSelect) => new Kysely<ClickhouseDatabase>({ dialect: clickhouseDialect(database) })),
  sqlite: memoize((database: typeof databases.$inferSelect) => new Kysely<SqliteDatabase>({ dialect: sqliteDialect(database) })),
} satisfies Record<DatabaseType, (database: typeof databases.$inferSelect) => unknown>
