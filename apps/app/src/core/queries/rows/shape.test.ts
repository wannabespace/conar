import { expect, mock, test } from 'bun:test'

import { EQUAL_FILTER, toKyselyFilter } from '@tamery/shared/filters'
import {
  Kysely,
  PostgresAdapter,
  PostgresQueryCompiler,
  DummyDriver,
  PostgresIntrospector,
} from 'kysely'

import {
  bindRow,
  bindValue,
  clickhouseFilterValues,
  matchesPrimaryKeys,
} from './shape'

mock.module('~/core/runtime/dialects/driver', () => ({
  createKyselyDriver: mock(),
}))

const { clickhouseColdDialect, prepareQuery } =
  await import('~/core/runtime/dialects/clickhouse')

const clickhouse = new Kysely<Record<string, Record<string, unknown>>>({
  dialect: clickhouseColdDialect(),
})

const postgres = new Kysely<Record<string, Record<string, unknown>>>({
  dialect: {
    createAdapter: () => new PostgresAdapter(),
    createDriver: () => new DummyDriver(),
    createIntrospector: (db) => new PostgresIntrospector(db),
    createQueryCompiler: () => new PostgresQueryCompiler(),
  },
})

test('ClickHouse parses ISO text for a DateTime column only, in SET and WHERE', () => {
  const columns = [
    { id: 'at', type: "DateTime64(3, 'UTC')" },
    { id: 'note', type: 'String' },
  ]
  const iso = '2024-02-29T13:45:10.123Z'
  const query = clickhouse
    .updateTable('events')
    .set(bindRow(bindValue.clickhouse, columns, { note: iso }))
    .where((eb) =>
      matchesPrimaryKeys(eb, bindValue.clickhouse, columns, { at: iso })
    )

  expect(prepareQuery(query.compile())).toBe(
    `alter table \`events\` update \`note\` = '${iso}' where \`at\` = parseDateTime64BestEffort('${iso}', 3) settings mutations_sync = 1`
  )
})

test('ClickHouse filters parse ISO text for a DateTime column and keep it for a String one', () => {
  const columns = [
    { id: 'at', type: 'DateTime' },
    { id: 'note', type: 'String' },
  ]
  const iso = '2024-02-29T13:45:10Z'
  const query = clickhouse
    .selectFrom('events')
    .selectAll()
    .where((eb) =>
      toKyselyFilter(
        eb,
        ['at', 'note'].map((column) => ({
          column,
          ref: EQUAL_FILTER,
          values: [iso],
        })),
        'AND',
        clickhouseFilterValues(columns)
      )
    )

  expect(prepareQuery(query.compile())).toBe(
    `select * from \`events\` where (\`at\` = parseDateTime64BestEffort('${iso}', 0) and \`note\` = '${iso}')`
  )
})

test('a json column binds json text, NULL as is and undefined as DEFAULT', () => {
  const columns = [{ id: 'tags', type: 'jsonb' }]
  const { parameters, sql } = postgres
    .updateTable('posts')
    .set(bindRow(bindValue.postgres, columns, { tags: ['a'] }))
    .set(bindRow(bindValue.postgres, [], { body: undefined, title: null }))
    .compile()

  expect(sql).toBe(
    'update "posts" set "tags" = $1, "body" = default, "title" = $2'
  )
  expect(parameters).toEqual(['["a"]', null])
})
