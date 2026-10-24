import { expect, test } from 'bun:test'

import { Dialect } from '@tamery/shared/enums/connection-type'
import { EQUAL_FILTER } from '@tamery/shared/filters'

import { coldDialect } from './kysely'
import { selectPage } from './select-page'

test('a column name with a space or a dot stays one identifier', () => {
  const { sql } = selectPage(coldDialect(Dialect.Postgres), {
    filters: [{ column: 'a.b', ref: EQUAL_FILTER, values: [1] }],
    limit: 10,
    offset: 0,
    orderBy: { 'first name': 'DESC' },
    schema: 'public',
    select: ['first name', 'a.b'],
    table: 'people',
  }).compile()

  expect(sql).toBe(
    'select "first name" as "first name", "a.b" as "a.b" from "public"."people" where "a.b" = $1 order by "first name" desc limit $2 offset $3'
  )
})
