import { Dialect } from '@tamery/shared/enums/connection-type'
import type { Kysely } from 'kysely'
import { sql } from 'kysely'

import { getCapabilities } from '~/core/catalog/capabilities'
import type { Database as MysqlDatabase } from '~/core/runtime/dialects/mysql/schema'

export const mysqlIndexes = (db: Kysely<MysqlDatabase>) =>
  db
    .selectFrom('information_schema.STATISTICS')
    .select([
      'TABLE_SCHEMA as schema',
      'TABLE_NAME as table',
      'INDEX_NAME as name',
      'COLUMN_NAME as column',
      (eb) => eb('NON_UNIQUE', '=', 0).as('is_unique'),
      (eb) => eb('INDEX_NAME', '=', 'PRIMARY').as('is_primary'),
      'INDEX_TYPE as index_type',
      sql<boolean>`COALESCE(INDEX_TYPE <> 'BTREE' OR SUB_PART IS NOT NULL OR COLLATION = 'D' OR COLUMN_NAME IS NULL, 0)`.as(
        'is_custom'
      ),
    ])
    .where(
      'TABLE_SCHEMA',
      'not in',
      getCapabilities(Dialect.MySQL).systemSchemas
    )
    .orderBy('SEQ_IN_INDEX')
    .execute()
