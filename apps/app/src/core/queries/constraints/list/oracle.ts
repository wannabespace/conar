import type { Kysely } from 'kysely'
import { sql } from 'kysely'

import type { Database as OracleDatabase } from '~/core/runtime/dialects/oracle/schema'

import type { LISTED_CONSTRAINT_TYPES } from '../shape'

export const oracleConstraints = (db: Kysely<OracleDatabase>) =>
  db
    .selectFrom('ALL_CONSTRAINTS as c')
    .innerJoin('ALL_USERS as u', 'u.USERNAME', 'c.OWNER')
    // A check naming no column has no ALL_CONS_COLUMNS row, and still lists.
    .leftJoin('ALL_CONS_COLUMNS as cc', (join) =>
      join
        .onRef('cc.OWNER', '=', 'c.OWNER')
        .onRef('cc.CONSTRAINT_NAME', '=', 'c.CONSTRAINT_NAME')
    )
    .leftJoin('ALL_CONS_COLUMNS as rc', (join) =>
      join
        .onRef('rc.OWNER', '=', 'c.R_OWNER')
        .onRef('rc.CONSTRAINT_NAME', '=', 'c.R_CONSTRAINT_NAME')
        .onRef('rc.POSITION', '=', 'cc.POSITION')
    )
    .select((eb) => [
      'c.OWNER as schema',
      'c.TABLE_NAME as table',
      'c.CONSTRAINT_NAME as name',
      eb
        .case('c.CONSTRAINT_TYPE')
        .when('P')
        .then('PRIMARY KEY')
        .when('U')
        .then('UNIQUE')
        .when('R')
        .then('FOREIGN KEY')
        .when('C')
        .then('CHECK')
        .end()
        .as('type'),
      'cc.COLUMN_NAME as column',
      'rc.OWNER as foreign_schema',
      'rc.TABLE_NAME as foreign_table',
      'rc.COLUMN_NAME as foreign_column',
      'c.DELETE_RULE as onDelete',
      eb.lit(null).as('onUpdate'),
      'c.SEARCH_CONDITION_VC as expression',
      // DEFERRABLE, DISABLE and NOVALIDATE have no field in the form, and a drop-and-add would leave them behind.
      eb
        .case()
        .when(
          eb.or([
            eb('c.DEFERRABLE', '=', 'DEFERRABLE'),
            eb('c.STATUS', '=', 'DISABLED'),
            eb('c.VALIDATED', '=', 'NOT VALIDATED'),
          ])
        )
        .then(1)
        .else(0)
        .end()
        .as('is_custom'),
    ])
    .$narrowType<{
      is_custom: 1 | 0
      onUpdate: null
      type: (typeof LISTED_CONSTRAINT_TYPES)[number]
    }>()
    .where('c.CONSTRAINT_TYPE', 'in', ['P', 'U', 'R', 'C'])
    // A column's NOT NULL is a system-named check; the column, not this list, owns it.
    .where((eb) =>
      eb.or([
        eb('c.CONSTRAINT_TYPE', '!=', 'C'),
        eb('c.GENERATED', '!=', 'GENERATED NAME'),
        eb('cc.COLUMN_NAME', 'is', null),
        eb(
          'c.SEARCH_CONDITION_VC',
          '!=',
          sql<string>`'"' || ${sql.ref('cc.COLUMN_NAME')} || '" IS NOT NULL'`
        ),
      ])
    )
    .where('u.ORACLE_MAINTAINED', '=', 'N')
    .where('c.TABLE_NAME', 'not like', 'BIN$%')
    .orderBy('cc.POSITION')
    .execute()
