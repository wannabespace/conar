import { SQLITE_RESOURCE_NAME } from '@tamery/connection/utils'
import type { Kysely } from 'kysely'
import { sql } from 'kysely'

import type {
  Pragmas,
  Database as SqliteDatabase,
} from '~/core/runtime/dialects/sqlite/schema'

const noReference = {
  foreign_column: null,
  foreign_schema: null,
  foreign_table: null,
  onDelete: null,
  onUpdate: null,
}

// SQLite names no constraint in its catalog: a key backed by an index takes the index's name, so the index links to it.
export const sqliteConstraints = async (db: Kysely<SqliteDatabase>) => {
  const tables = db
    .selectFrom('sqlite_schema as t')
    .where('t.type', '=', 'table')
  const indexedKeys = await tables
    .innerJoin(
      sql<Pragmas['index_list']>`pragma_index_list(t.name)`.as('il'),
      (join) => join.onTrue()
    )
    .innerJoin(
      sql<Pragmas['index_xinfo']>`pragma_index_xinfo(il.name)`.as('ix'),
      (join) => join.onTrue()
    )
    .select([
      't.name as table',
      'il.name as name',
      'ix.name as column',
      (eb) =>
        eb
          .case()
          .when('il.origin', '=', 'pk')
          .then('PRIMARY KEY')
          .else('UNIQUE')
          .end()
          .as('type'),
    ])
    .$narrowType<{ type: 'PRIMARY KEY' | 'UNIQUE' }>()
    .where('il.origin', 'in', ['pk', 'u'])
    .where('ix.key', '=', 1)
    .orderBy('t.name')
    .orderBy('il.name')
    .orderBy('ix.seqno')
    .execute()
  const rowidKeys = await tables
    .innerJoin(
      sql<Pragmas['table_xinfo']>`pragma_table_xinfo(t.name)`.as('c'),
      (join) => join.onTrue()
    )
    .select(['t.name as table', 'c.name as column'])
    .where('c.pk', '>', 0)
    .where(({ eb, exists, not, selectFrom }) =>
      not(
        exists(
          selectFrom(
            sql<Pragmas['index_list']>`pragma_index_list(t.name)`.as('pk')
          )
            .select(eb.lit(1).as('one'))
            .where('pk.origin', '=', 'pk')
        )
      )
    )
    .orderBy('t.name')
    .orderBy('c.pk')
    .execute()
  const foreignKeys = await tables
    .innerJoin(
      sql<Pragmas['foreign_key_list']>`pragma_foreign_key_list(t.name)`.as(
        'fk'
      ),
      (join) => join.onTrue()
    )
    .select([
      't.name as table',
      'fk.id',
      'fk.from as column',
      'fk.table as foreign_table',
      'fk.to as foreign_column',
      'fk.on_delete as onDelete',
      'fk.on_update as onUpdate',
    ])
    .orderBy('t.name')
    .orderBy('fk.id')
    .orderBy('fk.seq')
    .execute()
  const foreignKeyGroups = Map.groupBy(
    foreignKeys,
    (key) => `${key.table}\n${key.id}`
  ).values()

  return [
    ...indexedKeys.map((key) => ({
      ...noReference,
      ...key,
      schema: SQLITE_RESOURCE_NAME,
    })),
    ...rowidKeys.map((key) => ({
      ...noReference,
      ...key,
      name: `${key.table}_pkey`,
      schema: SQLITE_RESOURCE_NAME,
      type: 'PRIMARY KEY' as const,
    })),
    ...foreignKeyGroups.flatMap((group) =>
      group.map(({ id: _id, ...key }) => ({
        ...key,
        foreign_schema: SQLITE_RESOURCE_NAME,
        name: `${key.table}_${group.map(({ column }) => column).join('_')}_fkey`,
        schema: SQLITE_RESOURCE_NAME,
        type: 'FOREIGN KEY' as const,
      }))
    ),
  ]
}
