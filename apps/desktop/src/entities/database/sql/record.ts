import { type } from 'arktype'
import { CompiledQuery, sql } from 'kysely'
import { createQuery } from '../query'

export const primaryKeyInfoType = type({
  column_name: 'string',
  column_default: 'string | null',
  is_nullable: 'string',
  data_type: 'string',
}).pipe(data => ({
  ...data,
  id: data.column_name,
  type: data.data_type,
  isNullable: data.is_nullable === 'YES',
  defaultValue: data.column_default,
}))

export const databaseColumnType = type({
  id: 'string',
  type: 'string',
  is_nullable: 'boolean',
  default_value: 'string | null',
}).pipe(({ is_nullable, ...data }) => ({
  ...data,
  isNullable: Boolean(is_nullable),
}))

export const primaryKeysQuery = createQuery({
  type: primaryKeyInfoType.array(),
  query: ({ schema, table }: { schema: string, table: string }) => ({
    postgres: ({ db }) => {
      console.log(`Querying primary keys for schema=${schema}, table=${table}`)

      return db
        .selectFrom('information_schema.table_constraints as tc')
        .innerJoin('information_schema.key_column_usage as kcu', join =>
          join.on('tc.constraint_name', '=', 'kcu.constraint_name')
            .on('tc.table_schema', '=', 'kcu.table_schema'))
        .innerJoin('information_schema.columns as c', join =>
          join.on('c.column_name', '=', 'kcu.column_name')
            .on('c.table_name', '=', 'kcu.table_name')
            .on('c.table_schema', '=', 'kcu.table_schema'))
        .select([
          'kcu.column_name',
          'c.column_default',
          'c.is_nullable',
          'c.data_type',
        ])
        .where(eb => eb.and([
          eb('tc.constraint_type', '=', 'PRIMARY KEY'),
          eb('tc.table_schema', '=', schema),
          eb('tc.table_name', '=', table),
          eb('kcu.table_name', '=', table),
        ]))
        .execute()
        .then((result) => {
          console.log(`Primary key query result for ${schema}.${table}:`, result)
          return result
        })
    },
    mysql: ({ db }) => {
      return db
        .selectFrom('information_schema.TABLE_CONSTRAINTS as t')
        .innerJoin('information_schema.KEY_COLUMN_USAGE as k', join =>
          join.onRef('t.CONSTRAINT_NAME', '=', 'k.CONSTRAINT_NAME')
            .onRef('t.TABLE_SCHEMA', '=', 'k.TABLE_SCHEMA')
            .onRef('t.TABLE_NAME', '=', 'k.TABLE_NAME'))
        .innerJoin('information_schema.COLUMNS as c', join =>
          join.onRef('c.COLUMN_NAME', '=', 'k.COLUMN_NAME')
            .onRef('c.TABLE_NAME', '=', 'k.TABLE_NAME')
            .onRef('c.TABLE_SCHEMA', '=', 'k.TABLE_SCHEMA'))
        .select([
          'k.COLUMN_NAME as column_name',
          'c.COLUMN_DEFAULT as column_default',
          'c.IS_NULLABLE as is_nullable',
          'c.DATA_TYPE as data_type',
        ])
        .where(eb => eb.and([
          eb('t.CONSTRAINT_TYPE', '=', 'PRIMARY KEY'),
          eb('t.TABLE_SCHEMA', '=', schema),
          eb('t.TABLE_NAME', '=', table),
        ]))
        .execute()
    },
  }),
})

export const tableColumnsQuery = createQuery({
  type: databaseColumnType.array(),
  query: ({ schema, table }: { schema: string, table: string }) => ({
    postgres: ({ db }) => db
      .selectFrom('information_schema.columns')
      .select([
        'column_name as id',
        'data_type as type',
        sql<boolean>`is_nullable = 'YES'`.as('is_nullable'),
        'column_default as default_value',
      ])
      .where(eb => eb.and([
        eb('table_schema', '=', schema),
        eb('table_name', '=', table),
      ]))
      .orderBy('ordinal_position')
      .execute(),
    mysql: ({ db }) => db
      .selectFrom('information_schema.COLUMNS')
      .select([
        'COLUMN_NAME as id',
        'DATA_TYPE as type',
        sql<boolean>`IS_NULLABLE = 'YES'`.as('is_nullable'),
        'COLUMN_DEFAULT as default_value',
      ])
      .where(eb => eb.and([
        eb('TABLE_SCHEMA', '=', schema),
        eb('TABLE_NAME', '=', table),
      ]))
      .orderBy('ORDINAL_POSITION')
      .execute(),
  }),
})

export const insertRecordQuery = createQuery({
  query: ({
    schema,
    table,
    columns,
    values,
  }: {
    schema: string
    table: string
    columns: string[]
    values: unknown[]
  }) => ({
    postgres: ({ db }) => {
      const columnIdentifiers = columns.map(col => `"${col}"`).join(', ')
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ')

      const query = `INSERT INTO "${schema}"."${table}" (${columnIdentifiers}) VALUES (${placeholders})`
      return db.executeQuery(CompiledQuery.raw(query, values))
    },
    mysql: ({ db }) => {
      const columnIdentifiers = columns.map(col => `\`${col}\``).join(', ')
      const placeholders = columns.map(() => '?').join(', ')

      const query = `INSERT INTO \`${schema}\`.\`${table}\` (${columnIdentifiers}) VALUES (${placeholders})`
      return db.executeQuery(CompiledQuery.raw(query, values))
    },
  }),
})
