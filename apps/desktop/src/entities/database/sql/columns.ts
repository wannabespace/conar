import type { databases } from '~/drizzle'
import { type } from 'arktype'
import { sql } from 'kysely'
import { runSql } from '../query'

export const columnType = type({
  schema: 'string',
  table: 'string',
  id: 'string',
  default: 'string | null',
  type: 'string',
  editable: 'boolean',
  nullable: 'boolean',
})
  .pipe(({ editable, nullable, ...data }) => ({
    ...data,
    isEditable: editable,
    isNullable: nullable,
  }))

export function columnsSql(database: typeof databases.$inferSelect, { schema, table }: { schema: string, table: string }) {
  return runSql({
    validate: columnType.assert,
    database,
    label: `Columns for ${schema}.${table}`,
    query: {
      postgres: db => db
        .selectFrom('information_schema.columns')
        .select(eb => [
          'table_schema as schema',
          'table_name as table',
          'column_name as id',
          'column_default as default',
          eb.case()
            .when('data_type', '=', 'ARRAY')
            .then(sql<string>`REPLACE(${eb.ref('udt_name')}, '_', '') || '[]'`)
            .when('data_type', '=', 'USER-DEFINED')
            .then(eb.ref('udt_name'))
            .when('data_type', '=', 'character varying')
            .then('varchar')
            .when('data_type', '=', 'character')
            .then('char')
            .when('data_type', '=', 'bit varying')
            .then('varbit')
            .when('data_type', 'like', 'time%')
            .then(eb.ref('udt_name'))
            .else(eb.fn.coalesce('data_type', 'udt_name'))
            .end()
            .as('type'),
          eb.case()
            .when('is_nullable', '=', 'YES')
            .then(true)
            .else(false)
            .end()
            .as('nullable'),
          eb.case()
            .when('is_updatable', '=', 'YES')
            .then(true)
            .else(false)
            .end()
            .as('editable'),
        ])
        .where(({ and, eb }) => and([
          eb('table_schema', '=', schema),
          eb('table_name', '=', table),
        ]))
        .$assertType<typeof columnType.inferIn>()
        .compile(),
      mysql: () => {
        throw new Error('Not implemented')
      },
    },
  })
}
