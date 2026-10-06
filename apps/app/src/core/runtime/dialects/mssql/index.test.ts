import { expect, mock, test } from 'bun:test'

import { Kysely } from 'kysely'

mock.module('~/core/runtime/dialects/driver', () => ({
  createKyselyDriver: mock(),
}))

const { mssqlColdDialect } = await import('.')

const db = new Kysely<Record<string, Record<string, unknown>>>({
  dialect: mssqlColdDialect(),
})

test('a null is inlined and the remaining parameters keep their numbering', () => {
  const { parameters, sql } = db
    .updateTable('files')
    .set({ data: null, name: 'a' })
    .where('id', '=', 1)
    .compile()

  expect(sql).toBe(
    'update "files" set "data" = null, "name" = @1 where "id" = @2'
  )
  expect(parameters).toEqual(['a', 1])
})

test.each([
  {
    expected: 'select distinct top(5) "name" from "users"',
    query: db.selectFrom('users').select('name').distinct().limit(5),
  },
  {
    expected:
      'select * from "users" order by (select null) offset @1 rows fetch next @2 rows only',
    query: db.selectFrom('users').selectAll().limit(5).offset(10),
  },
  {
    expected:
      'select * from "users" order by "name" offset @1 rows fetch next @2 rows only',
    query: db
      .selectFrom('users')
      .selectAll()
      .orderBy('name')
      .limit(5)
      .offset(10),
  },
  {
    expected: 'select * from "users" order by (select null) offset @1 rows',
    query: db.selectFrom('users').selectAll().offset(10),
  },
])('compiles a limit SQL Server accepts: $expected', ({ expected, query }) => {
  expect(query.compile().sql).toBe(expected)
})
