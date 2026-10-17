import type { Kysely } from 'kysely'
import { sql } from 'kysely'

import type { Database as PostgresDatabase } from '~/core/runtime/dialects/postgres/schema'

import type { LISTED_CONSTRAINT_TYPES } from '../shape'

export const postgresConstraints = (db: Kysely<PostgresDatabase>) =>
  db
    .selectFrom('pg_catalog.pg_constraint as con')
    .innerJoin('pg_catalog.pg_class as c', 'con.conrelid', 'c.oid')
    .innerJoin('pg_catalog.pg_namespace as n', 'c.relnamespace', 'n.oid')
    // A check naming no column has no conkey, and still lists.
    .leftJoin('pg_catalog.pg_attribute as a', (join) =>
      join
        .onRef('a.attrelid', '=', 'con.conrelid')
        .on(sql<boolean>`a.attnum = ANY(con.conkey)`)
    )
    .leftJoin('pg_catalog.pg_class as fc', 'con.confrelid', 'fc.oid')
    .leftJoin('pg_catalog.pg_namespace as fn', (join) =>
      join.onRef('fn.oid', '=', 'fc.relnamespace')
    )
    .leftJoin('pg_catalog.pg_attribute as fa', (join) =>
      join
        .onRef('fa.attrelid', '=', 'con.confrelid')
        .on(
          sql<boolean>`fa.attnum = (con.confkey)[array_position(con.conkey, a.attnum)]`
        )
    )
    .select([
      'n.nspname as schema',
      'c.relname as table',
      'con.conname as name',
      (eb) =>
        eb
          .case('con.contype')
          .when('p')
          .then('PRIMARY KEY')
          .when('u')
          .then('UNIQUE')
          .when('f')
          .then('FOREIGN KEY')
          .when('c')
          .then('CHECK')
          .end()
          .as('type'),
      'a.attname as column',
      'fn.nspname as foreign_schema',
      'fc.relname as foreign_table',
      'fa.attname as foreign_column',
      (eb) =>
        eb
          .case('con.confdeltype')
          .when('a')
          .then('NO ACTION')
          .when('r')
          .then('RESTRICT')
          .when('c')
          .then('CASCADE')
          .when('n')
          .then('SET NULL')
          .when('d')
          .then('SET DEFAULT')
          .end()
          .as('onDelete'),
      (eb) =>
        eb
          .case('con.confupdtype')
          .when('a')
          .then('NO ACTION')
          .when('r')
          .then('RESTRICT')
          .when('c')
          .then('CASCADE')
          .when('n')
          .then('SET NULL')
          .when('d')
          .then('SET DEFAULT')
          .end()
          .as('onUpdate'),
      sql<string>`pg_get_constraintdef(con.oid)`.as('definition'),
      sql<string | null>`pg_get_expr(con.conbin, con.conrelid)`.as(
        'expression'
      ),
      // DEFERRABLE, NOT VALID, NO INHERIT and MATCH FULL have no field in
      // the form, and a drop-and-add would leave them behind.
      (eb) =>
        eb
          .or([
            eb('con.condeferrable', '=', true),
            eb('con.convalidated', '=', false),
            // Key constraints report connoinherit too; only a check's is a choice.
            eb.and([
              eb('con.contype', '=', 'c'),
              eb('con.connoinherit', '=', true),
            ]),
            eb.and([
              eb('con.contype', '=', 'f'),
              eb('con.confmatchtype', '!=', 's'),
            ]),
          ])
          .as('is_custom'),
    ])
    .$narrowType<{ type: (typeof LISTED_CONSTRAINT_TYPES)[number] }>()
    .where('con.contype', 'in', ['p', 'u', 'f', 'c'])
    // A partition's copy of its parent's constraint neither drops nor
    // renames on its own, and the parent's row already stands for it.
    .where('con.coninhcount', '=', 0)
    .where('n.nspname', 'not like', 'pg_%')
    .where('n.nspname', '!=', 'information_schema')
    .orderBy(sql<number>`array_position(con.conkey, a.attnum)`)
    .execute()
