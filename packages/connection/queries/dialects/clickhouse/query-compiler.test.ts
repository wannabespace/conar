import { expect, test } from 'bun:test'

import { Dialect } from '@tamery/shared/enums/connection-type'
import { sql } from 'kysely'

import { coldDialect } from '../../kysely'
import { prepareQuery } from './prepare-query'

test('a backslash or backquote in a name cannot end the identifier', () => {
  const query = coldDialect(Dialect.ClickHouse)
    .withTables<Record<string, Record<string, unknown>>>()
    .selectFrom('events')
    .select(sql.id('a\\').as('a\\`?'))
    .where('id', '=', 1)

  expect(prepareQuery(query.compile())).toBe(
    'select `a\\\\` as `a\\\\``?` from `events` where `id` = 1'
  )
})
