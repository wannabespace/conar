import { type } from 'arktype'
import { sql } from 'kysely'
import { createQuery } from '../query'

export const columnType = type({
  'schema': 'string',
  'table': 'string',
  'id': 'string',
  'default': 'string | null',
  'type': 'string',
  'editable?': 'boolean',
  'nullable': 'boolean | 1 | 0', // MySQL returns 1 or 0 in runtime
})
  .pipe(({ editable, nullable, ...data }) => ({
    ...data,
    isEditable: Boolean(editable ?? true),
    isNullable: Boolean(nullable),
  }))

export const columnsQuery = createQuery({
  type: columnType.array(),
  query: ({ schema, table }: { schema: string, table: string }) => ({
    postgres: ({ db }) => {
      const query = db
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
          eb.case('is_nullable')
            .when('YES')
            .then(true)
            .else(false)
            .end()
            .as('nullable'),
          eb.case('is_updatable')
            .when('YES')
            .then(true)
            .else(false)
            .end()
            .as('editable'),
        ])
        .where(({ and, eb }) => and([
          eb('table_schema', '=', schema),
          eb('table_name', '=', table),
        ]))
        .execute()

      return query
    },
    mysql: ({ db }) => db
      .selectFrom('information_schema.COLUMNS')
      .select(eb => [
        'TABLE_SCHEMA as schema',
        'TABLE_NAME as table',
        'COLUMN_NAME as id',
        'COLUMN_DEFAULT as default',
        eb.fn.coalesce('DATA_TYPE', 'COLUMN_TYPE').as('type'),
        eb
          .case()
          .when('IS_NULLABLE', '=', 'YES')
          .then(true)
          .else(false)
          .end()
          .as('nullable'),
      ])
      .where(({ and, eb }) => and([
        eb('TABLE_SCHEMA', '=', schema),
        eb('TABLE_NAME', '=', table),
        eb('DATA_TYPE', '!=', 'enum'),
      ]))
      .execute(),
  }),
})
