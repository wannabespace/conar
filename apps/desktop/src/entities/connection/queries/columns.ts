import type { connectionsResources } from '~/drizzle/schema'
import { memoize } from '@conar/memoize'
import { queryOptions } from '@tanstack/react-query'
import { type } from 'arktype'
import { sql } from 'kysely'
import { connectionResourceToQueryParams, createQuery } from '../query'

export const columnType = type({
  'schema': 'string',
  'table': 'string',
  'id': 'string',
  'default': 'string | null',
  'type': 'string',
  'label': 'string',
  'enumName?': 'string',
  'isArray?': 'boolean',
  'editable?': 'boolean | 1 | 0',
  'nullable': 'boolean | 1 | 0',
  'maxLength?': 'number | null',
  'precision?': 'number | null',
  'scale?': 'number | null',
  'isIdentity?': 'boolean | number',
})
  .pipe(({ editable, nullable, isIdentity, ...data }) => ({
    ...data,
    isEditable: Boolean(editable ?? true),
    isNullable: Boolean(nullable),
    isIdentity: Boolean(isIdentity),
  }))

const clickhouseEnumRegex = /^Enum\d+/

function getClickhouseColumnType(type: string): string {
  if (type.startsWith('Array(') && type.endsWith(')')) {
    return `${getClickhouseColumnType(type.slice(6, -1))}[]`
  }

  if (type.startsWith('Nullable(') && type.endsWith(')')) {
    return getClickhouseColumnType(type.slice(9, -1))
  }

  if (type.startsWith('LowCardinality(') && type.endsWith(')')) {
    return getClickhouseColumnType(type.slice(15, -1))
  }

  if (type.startsWith('Enum')) {
    return type.match(clickhouseEnumRegex)?.[0] || 'Enum'
  }

  return type
}

function getPgColumnType(type: string, udtName: string) {
  if (type === 'ARRAY') {
    return udtName.slice(1)
  }
  else if (type === 'USER-DEFINED') {
    return udtName
  }
  else if (type === 'character varying') {
    return 'varchar'
  }
  else if (type === 'character') {
    return 'char'
  }
  else if (type === 'bit varying') {
    return 'varbit'
  }
  else if (type.startsWith('time')) {
    return udtName || type
  }

  return type
}

const resourceTableColumnsQuery = memoize(({ table, schema }: { table: string, schema: string }) => {
  return createQuery({
    type: columnType.array(),
    query: {
      postgres: async (db) => {
        const query = await db
          .selectFrom('information_schema.columns')
          .select(eb => [
            'table_schema as schema',
            'table_name as table',
            'column_name as id',
            'column_default as default',
            'data_type',
            'udt_name',
            'character_maximum_length as max_length',
            'numeric_precision as precision',
            'numeric_scale as scale',
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

        return query.map(({ data_type, udt_name, ...row }) => ({
          ...row,
          type: data_type === 'ARRAY' ? `${udt_name.slice(1)}[]` : data_type,
          label: data_type === 'ARRAY' ? `${getPgColumnType(data_type, udt_name)}[]` : getPgColumnType(data_type, udt_name),
          enumName: data_type === 'USER-DEFINED'
            ? udt_name
            : data_type === 'ARRAY'
              ? udt_name.slice(1)
              : undefined,
          isArray: data_type === 'ARRAY',
          maxLength: row.max_length,
        } satisfies typeof columnType.inferIn))
      },
      mysql: async (db) => {
        const query = await db
          .selectFrom('information_schema.COLUMNS')
          .select(eb => [
            'TABLE_SCHEMA as schema',
            'TABLE_NAME as table',
            'COLUMN_NAME as id',
            'COLUMN_DEFAULT as default',
            'CHARACTER_MAXIMUM_LENGTH as max_length',
            'NUMERIC_PRECISION as precision',
            'NUMERIC_SCALE as scale',
            eb.fn.coalesce('DATA_TYPE', 'COLUMN_TYPE').as('type'),
            eb
              .case('IS_NULLABLE')
              .when('YES')
              .then(1)
              .else(0)
              .end()
              .$castTo<1 | 0>()
              .as('nullable'),
          ])
          .where(({ and, eb }) => and([
            eb('TABLE_SCHEMA', '=', schema),
            eb('TABLE_NAME', '=', table),
          ]))
          .execute()

        return query.map(column => ({
          ...column,
          label: column.type,
          enumName: column.type === 'set' || column.type === 'enum' ? column.id : undefined,
          isArray: column.type === 'set',
          maxLength: column.max_length,
        } satisfies typeof columnType.inferIn))
      },
      mssql: async (db) => {
        const query = await db
          .selectFrom('information_schema.COLUMNS')
          .select(eb => [
            'TABLE_SCHEMA as schema',
            'TABLE_NAME as table',
            'COLUMN_NAME as name',
            'COLUMN_DEFAULT as default',
            'CHARACTER_MAXIMUM_LENGTH as max_length',
            'NUMERIC_PRECISION as precision',
            'NUMERIC_SCALE as scale',
            'DATA_TYPE as type',
            sql<boolean>`
              COLUMNPROPERTY(
                OBJECT_ID(TABLE_SCHEMA + '.' + TABLE_NAME),
                COLUMN_NAME,
                'IsIdentity'
              )
            `.as('isIdentity'),
            eb
              .case('IS_NULLABLE')
              .when('YES')
              .then(1)
              .else(0)
              .end()
              .$castTo<1 | 0>()
              .as('nullable'),
          ])
          .where(({ and, eb }) => and([
            eb('TABLE_SCHEMA', '=', schema),
            eb('TABLE_NAME', '=', table),
          ]))
          .execute()

        return query.map(({ name, ...column }) => ({
          ...column,
          id: name,
          label: column.type,
          enumName: column.type === 'set' || column.type === 'enum' ? name : undefined,
          isArray: column.type === 'set',
          maxLength: column.max_length,
        } satisfies typeof columnType.inferIn))
      },
      clickhouse: async (db) => {
        const query = await db
          .selectFrom('information_schema.columns')
          .select(eb => [
            'table_schema as schema',
            'table_name as table',
            'column_name as id',
            'column_default as default',
            'data_type as type',
            eb.case('is_nullable')
              .when(1)
              .then(true)
              .else(false)
              .end()
              .as('nullable'),
          ])
          .where(({ and, eb }) => and([
            eb('table_schema', '=', schema),
            eb('table_name', '=', table),
          ]))
          .execute()

        return query.map(row => ({
          ...row,
          enumName: row.type.includes('Enum') ? row.id : undefined,
          isArray: row.type.includes('Array('),
          label: getClickhouseColumnType(row.type),
          editable: true,
        }))
      },
    },
  })
})

export function resourceTableColumnsQueryOptions({
  connectionResource,
  table,
  schema,
}: {
  connectionResource: typeof connectionsResources.$inferSelect
  table: string
  schema: string
}) {
  return queryOptions({
    queryKey: ['connection-resource', connectionResource.id, 'columns', schema, table],
    queryFn: () => resourceTableColumnsQuery({ table, schema }).run(connectionResourceToQueryParams(connectionResource)),
  })
}
