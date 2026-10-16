import { SQLITE_RESOURCE_NAME } from '@tamery/connection/sqlite-file'
import type { Kysely } from 'kysely'
import { sql } from 'kysely'

import { userObject } from '~/core/queries/shared/sqlite-catalog'
import type {
  Pragmas,
  Database as SqliteDatabase,
} from '~/core/runtime/dialects/sqlite/schema'

const SQLITE_EXPRESSION_KEY = -2

export const sqliteIndexes = async (db: Kysely<SqliteDatabase>) => {
  const rows = await db
    .selectFrom('sqlite_schema as t')
    .innerJoin(
      sql<Pragmas['index_list']>`pragma_index_list(t.name)`.as('il'),
      (join) => join.onTrue()
    )
    .innerJoin(
      sql<Pragmas['index_xinfo']>`pragma_index_xinfo(il.name)`.as('ix'),
      (join) => join.onTrue()
    )
    .leftJoin('sqlite_schema as s', (join) =>
      join.onRef('s.name', '=', 'il.name').on('s.type', '=', 'index')
    )
    .select([
      (eb) => eb.val(SQLITE_RESOURCE_NAME).as('schema'),
      't.name as table',
      'il.name as name',
      'ix.name as column',
      // An expression key has no column, and only the definition spells it.
      (eb) =>
        eb
          .case()
          .when('ix.cid', '=', SQLITE_EXPRESSION_KEY)
          .then(sql<string>`'expression ' || (ix.seqno + 1)`)
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
    .where('t.type', '=', 'table')
    .where(userObject('t.name'))
    .where('ix.key', '=', 1)
    .orderBy('t.name')
    .orderBy('il.name')
    .orderBy('ix.seqno')
    .execute()
  return rows.map(({ index_definition: definition, ...row }) => ({
    ...row,
    index_definition: definition ?? undefined,
  }))
}
