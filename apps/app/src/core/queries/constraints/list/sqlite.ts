import type { Kysely } from 'kysely'

import {
  indexKeys,
  keyIndexed,
  pragma,
  userTables,
} from '~/core/queries/shared/sqlite-catalog'
import type { Database as SqliteDatabase } from '~/core/runtime/dialects/sqlite/schema'

const noReference = {
  foreign_column: null,
  foreign_schema: null,
  foreign_table: null,
  onDelete: null,
  onUpdate: null,
}

// SQLite names no constraint in its catalog: a key backed by an index takes the index's name, so the index links to it.
export const sqliteConstraints = async (db: Kysely<SqliteDatabase>) => {
  const [indexedKeys, rowidKeys, foreignKeys] = await Promise.all([
    indexKeys(db)
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
      .execute(),
    userTables(db, ['table'])
      .crossJoin(pragma('table_xinfo', 't.name').as('c'))
      .select(['t.name as table', 'c.name as column'])
      .where('c.pk', '>', 0)
      .where((eb) => eb.not(keyIndexed('t.name')))
      .orderBy('t.name')
      .orderBy('c.pk')
      .execute(),
    userTables(db, ['table'])
      .crossJoin(pragma('foreign_key_list', 't.name').as('fk'))
      // `REFERENCES parent` without columns stores no target: it names the parent's primary key, in key order.
      .leftJoin(pragma('table_xinfo', 'fk.table').as('target'), (join) =>
        join.on((eb) =>
          eb.and([
            eb('fk.to', 'is', null),
            eb('target.pk', '=', eb('fk.seq', '+', 1)),
          ])
        )
      )
      .select((eb) => [
        't.name as table',
        'fk.id',
        'fk.from as column',
        't.schema as foreign_schema',
        'fk.table as foreign_table',
        eb.fn.coalesce('fk.to', 'target.name').as('foreign_column'),
        'fk.on_delete as onDelete',
        'fk.on_update as onUpdate',
      ])
      .orderBy('t.name')
      .orderBy('fk.id')
      .orderBy('fk.seq')
      .execute(),
  ])
  const foreignKeyGroups = Map.groupBy(
    foreignKeys,
    (key) => `${key.table}\n${key.id}`
  ).values()

  const owners = new Map<string, number>()

  return [
    ...indexedKeys.map((key) => ({ ...noReference, ...key })),
    ...rowidKeys.map((key) => ({
      ...noReference,
      ...key,
      name: `${key.table}_pkey`,
      type: 'PRIMARY KEY' as const,
    })),
    ...foreignKeyGroups.flatMap((group) =>
      group.map(({ id, ...key }) => {
        const name = `${key.table}_${group.map(({ column }) => column).join('_')}_${key.foreign_table}_fkey`
        // SQLite allows two keys on the same columns to the same table; the later one gets a number, as Postgres does.
        const owner = owners.get(name) ?? owners.set(name, id).get(name)
        return {
          ...key,
          name: owner === id ? name : `${name}${id}`,
          type: 'FOREIGN KEY' as const,
        }
      })
    ),
  ]
}
