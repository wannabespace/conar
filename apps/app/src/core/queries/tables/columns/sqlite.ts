import type { Kysely } from 'kysely'

import {
  keyIndexed,
  pragma,
  userTables,
} from '~/core/queries/shared/sqlite-catalog'
import type { Database as SqliteDatabase } from '~/core/runtime/dialects/sqlite/schema'

import type { ColumnsFilter } from '../shape'

export const sqliteColumns = (
  db: Kysely<SqliteDatabase>,
  filter: ColumnsFilter
) =>
  userTables(db, ['table', 'view', 'virtual'])
    .crossJoin(pragma('table_xinfo', 't.name').as('c'))
    .select((eb) => {
      const rowidAlias = eb.and([
        eb('c.pk', '=', 1),
        eb.not(keyIndexed('t.name')),
      ])
      return [
        't.name as table',
        'c.name as id',
        'c.dflt_value as default',
        eb.fn
          .coalesce(
            eb.fn<string | null>('nullif', [
              eb.fn('lower', ['c.type']),
              eb.val(''),
            ]),
            eb.val('any')
          )
          .as('type'),
        eb.lit(null).as('comment'),
        eb.or([eb('c.hidden', 'in', [2, 3]), rowidAlias]).as('isGenerated'),
        eb.and([eb('c.notnull', '=', 0), eb('c.pk', '=', 0)]).as('nullable'),
        rowidAlias.as('isIdentity'),
      ]
    })
    .where('c.hidden', '!=', 1)
    .$call((qb) => (filter ? qb.where('t.name', '=', filter.table) : qb))
    .orderBy('t.name')
    .orderBy('c.cid')
    .execute()
