import type { Kysely } from 'kysely'

import { indexKeys } from '~/core/queries/shared/sqlite-catalog'
import type { Database as SqliteDatabase } from '~/core/runtime/dialects/sqlite/schema'

const SQLITE_EXPRESSION_KEY = -2

export const sqliteIndexes = (db: Kysely<SqliteDatabase>) =>
  indexKeys(db)
    .leftJoin('sqlite_schema as s', (join) =>
      join.onRef('s.name', '=', 'il.name').on('s.type', '=', 'index')
    )
    .select([
      't.name as table',
      'il.name as name',
      'ix.name as column',
      // An expression key has no column, and only the definition spells it.
      (eb) =>
        eb
          .case()
          .when('ix.cid', '=', SQLITE_EXPRESSION_KEY)
          .then(
            eb.fn<string>('printf', [
              eb.val('expression %d'),
              eb('ix.seqno', '+', 1),
            ])
          )
          .end()
          .as('custom_expression'),
      'il.unique as is_unique',
      (eb) => eb('il.origin', '=', 'pk').as('is_primary'),
      (eb) => eb('il.origin', '=', 'u').as('is_constraint'),
      's.sql as index_definition',
      (eb) =>
        eb
          .or([
            eb('il.partial', '=', 1),
            eb('ix.desc', '=', 1),
            eb('ix.cid', '=', SQLITE_EXPRESSION_KEY),
            eb('ix.coll', '!=', 'BINARY'),
          ])
          .as('is_custom'),
    ])
    .execute()
