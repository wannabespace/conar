import { expect, test } from 'bun:test'

import { Dialect } from '@tamery/shared/enums/connection-type'

import { coldDialect } from './kysely'
import { selectPage } from './select-page'

test('a column name with a space or a dot stays one identifier', () => {
  const { sql } = selectPage(coldDialect(Dialect.Postgres), {
    limit: 10,
    offset: 0,
    orderBy: { 'first name': 'DESC' },
    schema: 'public',
    select: ['first name', 'a.b'],
    table: 'people',
  }).compile()

  expect(sql).toBe(
    'select "first name" as "first name", "a.b" as "a.b" from "public"."people" order by "first name" desc limit $1 offset $2'
  )
})
