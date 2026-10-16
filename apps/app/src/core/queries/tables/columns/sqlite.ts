import { SQLITE_RESOURCE_NAME } from '@tamery/connection/utils'
import type { Kysely } from 'kysely'
import { sql } from 'kysely'

import type {
  Pragmas,
  Database as SqliteDatabase,
} from '~/core/runtime/dialects/sqlite/schema'

import type { ColumnsFilter } from '../shape'

export const sqliteColumns = (
  db: Kysely<SqliteDatabase>,
  filter: ColumnsFilter
) =>
  db
    .selectFrom([
      'sqlite_schema as m',
      sql<Pragmas['table_xinfo']>`pragma_table_xinfo(m.name)`.as('c'),
    ])
    .select((eb) => [
      eb.val(SQLITE_RESOURCE_NAME).as('schema'),
      'm.name as table',
      'c.name as id',
      'c.dflt_value as default',
      sql<string>`coalesce(nullif(lower(c.type), ''), 'any')`.as('type'),
      sql<string | null>`null`.as('comment'),
      eb('c.hidden', 'in', [2, 3]).as('isGenerated'),
      eb.and([eb('c.notnull', '=', 0), eb('c.pk', '=', 0)]).as('nullable'),
      // Only a lone INTEGER PRIMARY KEY of a rowid table aliases the rowid, which fills itself.
      eb
        .and([
          eb('c.pk', '=', 1),
          eb(eb.fn('lower', ['c.type']), '=', 'integer'),
          eb('m.sql', 'not like', '%without rowid%'),
          eb(
            eb
              .selectFrom(
                sql<Pragmas['table_xinfo']>`pragma_table_xinfo(m.name)`.as('k')
              )
              .select((sub) => sub.fn.countAll().as('keys'))
              .where('k.pk', '>', 0),
            '=',
            1
          ),
        ])
        .as('isIdentity'),
    ])
    .where('m.type', 'in', ['table', 'view'])
    .where((eb) =>
      eb(eb.fn('substr', ['m.name', eb.val(1), eb.val(7)]), '!=', 'sqlite_')
    )
    .where('c.hidden', '!=', 1)
    .$call((qb) => (filter ? qb.where('m.name', '=', filter.table) : qb))
    .orderBy('m.name')
    .orderBy('c.cid')
    .execute()
