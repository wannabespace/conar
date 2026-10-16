import { SQLITE_RESOURCE_NAME } from '@tamery/connection/sqlite-location'
import type { Kysely } from 'kysely'
import { expressionBuilder, sql } from 'kysely'

import type {
  Pragmas,
  Database as SqliteDatabase,
} from '~/core/runtime/dialects/sqlite/schema'

const eb = expressionBuilder<SqliteDatabase>()

export const pragma = <Name extends keyof Pragmas>(name: Name, ref: string) =>
  sql<Pragmas[Name]>`${sql.raw(`pragma_${name}`)}(${sql.ref(ref)})`

/** Every primary key has a backing index except a rowid table's INTEGER PRIMARY KEY, which is the rowid itself (`INTEGER PRIMARY KEY DESC` is not). */
export const keyIndexed = (table: string) =>
  eb.exists(
    eb
      .selectFrom(pragma('index_list', table).as('key_index'))
      .select(eb.lit(1).as('one'))
      .where('key_index.origin', '=', 'pk')
  )

/**
 * SQLite's own objects carry an exact `sqlite_` prefix and Cloudflare D1's an `_cf_` one, which D1 refuses to read, so a
 * catalog read that touches one fails whole. `LIKE` cannot match either, since `_` is its wildcard.
 */
export const userTables = (
  db: Kysely<SqliteDatabase>,
  types: Exclude<Pragmas['table_list']['type'], 'shadow'>[]
) =>
  db
    .selectFrom(sql<Pragmas['table_list']>`pragma_table_list()`.as('t'))
    .select('t.schema')
    .where('t.schema', '=', SQLITE_RESOURCE_NAME)
    .where('t.type', 'in', types)
    .where((expr) =>
      expr.and(
        ['sqlite_', '_cf_'].map((prefix) =>
          expr(
            expr.fn('substr', ['t.name', expr.val(1), expr.val(prefix.length)]),
            '!=',
            prefix
          )
        )
      )
    )

export const indexKeys = (db: Kysely<SqliteDatabase>) =>
  userTables(db, ['table'])
    .crossJoin(pragma('index_list', 't.name').as('il'))
    .crossJoin(pragma('index_xinfo', 'il.name').as('ix'))
    .where('ix.key', '=', 1)
    .orderBy('t.name')
    .orderBy('il.name')
    .orderBy('ix.seqno')
