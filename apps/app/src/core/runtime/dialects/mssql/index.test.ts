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
