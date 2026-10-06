import { expect, mock, test } from 'bun:test'

import { Kysely, sql } from 'kysely'

mock.module('~/core/runtime/dialects/driver', () => ({
  createKyselyDriver: mock(),
}))

const { clickhouseColdDialect, prepareQuery } = await import('.')

const db = new Kysely<Record<string, Record<string, unknown>>>({
  dialect: clickhouseColdDialect(),
})

const update = (value: unknown) =>
  prepareQuery(
    db
      .withSchema('default')
      .updateTable('events')
      .set({ value })
      .where('id', '=', 1)
      .compile()
  )

test('an ISO timestamp stays a string literal', () => {
  expect(update('2024-02-29T13:45:10Z')).toBe(
    "alter table `default`.`events` update `value` = '2024-02-29T13:45:10Z' where `id` = 1 settings mutations_sync = 1"
  )
})

test('a select is not turned into a mutation', () => {
  expect(prepareQuery(db.selectFrom('events').selectAll().compile())).toBe(
    'select * from `events`'
  )
})

test('a question mark inside a literal is not a placeholder', () => {
  expect(
    prepareQuery(
      sql`select * from events where note = 'why?' and id = ${1}`.compile(db)
    )
  ).toBe("select * from events where note = 'why?' and id = 1")
})

test('a table name outside \\w is still turned into a mutation', () => {
  expect(
    prepareQuery(
      db
        .withSchema('my-db')
        .updateTable('events-2024')
        .set({ value: 1 })
        .where('id', '=', 2)
        .compile()
    )
  ).toBe(
    'alter table `my-db`.`events-2024` update `value` = 1 where `id` = 2 settings mutations_sync = 1'
  )
})
