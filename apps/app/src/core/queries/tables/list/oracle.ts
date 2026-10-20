import type { Kysely } from 'kysely'
import { sql } from 'kysely'

import { userSchemas } from '~/core/queries/shared/oracle-catalog'
import type { Database as OracleDatabase } from '~/core/runtime/dialects/oracle/schema'

export const oracleTablesAndSchemas = (db: Kysely<OracleDatabase>) =>
  db
    .selectFrom(userSchemas(db).as('u'))
    .leftJoin(
      (eb) =>
        eb
          .selectFrom('ALL_TABLES as t')
          // ALL_TABLES also lists the table that holds a materialized view's rows, under the view's name.
          .leftJoin('ALL_MVIEWS as m', (join) =>
            join
              .onRef('m.OWNER', '=', 't.OWNER')
              .onRef('m.CONTAINER_NAME', '=', 't.TABLE_NAME')
          )
          .select((sub) => [
            't.OWNER as owner',
            't.TABLE_NAME as name',
            sub
              .case()
              .when('m.MVIEW_NAME', 'is', null)
              .then('base table')
              .else('materialized view')
              .end()
              .as('type'),
          ])
          .where('t.NESTED', '=', 'NO')
          .where('t.SECONDARY', '=', 'N')
          .where('t.DROPPED', '=', 'NO')
          .where((where) =>
            where.or([
              where('t.IOT_TYPE', 'is', null),
              where('t.IOT_TYPE', '=', 'IOT'),
            ])
          )
          .unionAll(
            eb
              .selectFrom('ALL_VIEWS')
              .select([
                'OWNER as owner',
                'VIEW_NAME as name',
                sql.lit('view').as('type'),
              ])
          )
          .as('o'),
      (join) => join.onRef('o.owner', '=', 'u.USERNAME')
    )
    .leftJoin('ALL_TAB_COMMENTS as tc', (join) =>
      join
        .onRef('tc.OWNER', '=', 'o.owner')
        .onRef('tc.TABLE_NAME', '=', 'o.name')
    )
    .leftJoin('ALL_MVIEW_COMMENTS as mc', (join) =>
      join
        .onRef('mc.OWNER', '=', 'o.owner')
        .onRef('mc.MVIEW_NAME', '=', 'o.name')
    )
    .select((eb) => [
      'u.USERNAME as schema',
      'o.name as table',
      eb.fn.coalesce('tc.COMMENTS', 'mc.COMMENTS').as('comment'),
      eb.fn.coalesce('o.type', sql.lit('base table')).as('type'),
    ])
    .$narrowType<{
      type: 'base table' | 'materialized view' | 'view'
    }>()
    .execute()
