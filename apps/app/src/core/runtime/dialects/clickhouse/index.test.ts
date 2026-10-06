import { expect, mock, test } from 'bun:test'

import { Kysely } from 'kysely'

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

test('a date-like string stays a string literal', () => {
  expect(update('42')).toBe(
    "alter table `default`.`events` update `value` = '42' where `id` = 1 settings mutations_sync = 1"
  )
})

test('an ISO timestamp is parsed at its own precision', () => {
  expect(update('2024-02-29T13:45:10.123456Z')).toContain(
    "`value` = parseDateTime64BestEffort('2024-02-29T13:45:10.123456Z', 6)"
  )
})

test('a select is not turned into a mutation', () => {
  expect(prepareQuery(db.selectFrom('events').selectAll().compile())).toBe(
    'select * from `events`'
  )
})
