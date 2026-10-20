import { expect, test } from 'bun:test'

import { prepareQuery } from '@tamery/connection/queries/dialects/clickhouse/prepare-query'
import { coldDialect } from '@tamery/connection/queries/kysely'
import { Dialect } from '@tamery/shared/enums/connection-type'
import {
  clickhouseFilterValues,
  EQUAL_FILTER,
  sqliteFilterValues,
  toKyselyFilter,
} from '@tamery/shared/filters'
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
  clickhouseWrite,
  matchesPrimaryKeys,
} from './shape'

const clickhouse = coldDialect(Dialect.ClickHouse).withTables<
  Record<string, Record<string, unknown>>
>()

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

test('SQLite filters bind true and false as 1 and 0 on a boolean column only', () => {
  const { parameters } = postgres
    .selectFrom('items')
    .selectAll()
    .where((eb) =>
      toKyselyFilter(
        eb,
        [
          { column: 'active', ref: EQUAL_FILTER, values: ['true'] },
          { column: 'note', ref: EQUAL_FILTER, values: ['false'] },
        ],
        'AND',
        sqliteFilterValues([
          { id: 'active', type: 'boolean' },
          { id: 'note', type: 'text' },
        ])
      )
    )
    .compile()

  expect(parameters).toEqual([1, 'false'])
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

test('a ClickHouse write without format() runs again with JSONExtract', async () => {
  const columns = [{ id: 'tags', type: 'Map(String, UInt8)' }]
  const sent: string[] = []
  await clickhouseWrite((bind) => {
    const statement = prepareQuery(
      clickhouse
        .updateTable('events')
        .set(bindRow(bind, columns, { tags: { a: 1 } }))
        .where('id', '=', 1)
        .compile()
    )
    sent.push(statement)
    return statement.includes('format(')
      ? Promise.reject(new Error('Unknown table function format'))
      : Promise.resolve()
  })

  expect(sent.at(-1)).toBe(
    `alter table \`events\` update \`tags\` = JSONExtract('{"v":{"a":1}}', 'v', 'Map(String, UInt8)') where \`id\` = 1 settings mutations_sync = 1`
  )
})
