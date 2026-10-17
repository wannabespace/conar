import { Dialect } from '@tamery/shared/enums/connection-type'
import type { Kysely } from 'kysely'

import { getCapabilities } from '~/core/catalog/capabilities'
import type {
  MariadbTables,
  Database as MysqlDatabase,
} from '~/core/runtime/dialects/mysql/schema'

import { LISTED_CONSTRAINT_TYPES } from '../shape'

export const mysqlConstraints = async (db: Kysely<MysqlDatabase>) => {
  const { mariadb } = await db
    .selectNoFrom((eb) =>
      eb(eb.fn('version'), 'like', '%MariaDB%').as('mariadb')
    )
    .executeTakeFirstOrThrow()
  return db
    .$extendTables<MariadbTables>()
    .selectFrom('information_schema.TABLE_CONSTRAINTS as tc')
    .leftJoin('information_schema.KEY_COLUMN_USAGE as kcu', (join) =>
      join
        .onRef('tc.CONSTRAINT_NAME', '=', 'kcu.CONSTRAINT_NAME')
        .onRef('tc.CONSTRAINT_SCHEMA', '=', 'kcu.CONSTRAINT_SCHEMA')
        .onRef('tc.TABLE_SCHEMA', '=', 'kcu.TABLE_SCHEMA')
        .onRef('tc.TABLE_NAME', '=', 'kcu.TABLE_NAME')
    )
    .leftJoin('information_schema.REFERENTIAL_CONSTRAINTS as rc', (join) =>
      join
        .onRef('tc.CONSTRAINT_NAME', '=', 'rc.CONSTRAINT_NAME')
        .onRef('tc.CONSTRAINT_SCHEMA', '=', 'rc.CONSTRAINT_SCHEMA')
        .onRef('tc.TABLE_NAME', '=', 'rc.TABLE_NAME')
    )
    .leftJoin('information_schema.CHECK_CONSTRAINTS as cc', (join) =>
      join
        .onRef('tc.CONSTRAINT_NAME', '=', 'cc.CONSTRAINT_NAME')
        .onRef('tc.CONSTRAINT_SCHEMA', '=', 'cc.CONSTRAINT_SCHEMA')
        .$call((on) =>
          mariadb ? on.onRef('tc.TABLE_NAME', '=', 'cc.TABLE_NAME') : on
        )
    )
    .select([
      'tc.TABLE_SCHEMA as schema',
      'tc.TABLE_NAME as table',
      'tc.CONSTRAINT_NAME as name',
      'tc.CONSTRAINT_TYPE as type',
      'kcu.COLUMN_NAME as column',
      'kcu.REFERENCED_TABLE_SCHEMA as foreign_schema',
      'kcu.REFERENCED_TABLE_NAME as foreign_table',
      'kcu.REFERENCED_COLUMN_NAME as foreign_column',
      'rc.DELETE_RULE as onDelete',
      'rc.UPDATE_RULE as onUpdate',
      'cc.CHECK_CLAUSE as expression',
    ])
    .where('tc.CONSTRAINT_TYPE', 'in', LISTED_CONSTRAINT_TYPES)
    .where(
      'tc.TABLE_SCHEMA',
      'not in',
      getCapabilities(Dialect.MySQL).systemSchemas
    )
    .orderBy('kcu.ORDINAL_POSITION')
    .execute()
}
