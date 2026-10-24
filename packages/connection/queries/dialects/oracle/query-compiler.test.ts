import { expect, test } from 'bun:test'

import { Dialect } from '@tamery/shared/enums/connection-type'
import { sql } from 'kysely'

import { coldDialect } from '../../kysely'

const db = coldDialect(Dialect.Oracle).withTables<
  Record<string, Record<string, unknown>>
>()

test.each([
  {
    expected:
      'select "u"."name" as "label" from "users" "u" inner join "roles" "r" on "r"."id" = "u"."role_id" where "u"."id" = :1',
    query: db
      .selectFrom('users as u')
      .innerJoin('roles as r', 'r.id', 'u.role_id')
      .select('u.name as label')
      .where('u.id', '=', 1),
  },
  {
    expected: 'select * from "users" fetch next :1 rows only',
    query: db.selectFrom('users').selectAll().limit(5),
  },
  {
    expected:
      'select * from "users" order by "name" offset :1 rows fetch next :2 rows only',
    query: db
      .selectFrom('users')
      .selectAll()
      .orderBy('name')
      .limit(5)
      .offset(10),
  },
  {
    expected: 'select 1 as "one" from dual',
    query: db.selectNoFrom(sql<number>`1`.as('one')),
  },
  {
    expected: 'select * from "users" where "active" = 1',
    query: db
      .selectFrom('users')
      .selectAll()
      .where('active', '=', sql.lit(true)),
  },
  {
    expected: 'alter table "users" add ("age" integer default 0 not null)',
    query: db.schema
      .alterTable('users')
      .addColumn('age', 'integer', (col) => col.notNull().defaultTo(0)),
  },
])('compiles what Oracle accepts: $expected', ({ expected, query }) => {
  expect(query.compile().sql).toBe(expected)
})
