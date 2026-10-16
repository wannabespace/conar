import { expressionBuilder, sql } from 'kysely'

import type {
  Pragmas,
  Database as SqliteDatabase,
} from '~/core/runtime/dialects/sqlite/schema'

const eb = expressionBuilder<SqliteDatabase>()

/** Every primary key has a backing index except a rowid table's INTEGER PRIMARY KEY, which is the rowid itself (`INTEGER PRIMARY KEY DESC` is not). */
export const keyIndexed = (table: string) =>
  eb.exists(
    eb
      .selectFrom(
        sql<Pragmas['index_list']>`pragma_index_list(${sql.ref(table)})`.as(
          'key_index'
        )
      )
      .select(eb.lit(1).as('one'))
      .where('key_index.origin', '=', 'pk')
  )

/**
 * SQLite's own objects carry an exact `sqlite_` prefix and Cloudflare D1's an `_cf_` one, which D1 refuses to read, so a
 * catalog read that touches one fails whole. `LIKE` cannot match either, since `_` is its wildcard.
 */
export const userObject = (name: string) =>
  eb.and(
    ['sqlite_', '_cf_'].map((prefix) =>
      eb(
        eb.fn('substr', [sql.ref(name), eb.val(1), eb.val(prefix.length)]),
        '!=',
        prefix
      )
    )
  )
