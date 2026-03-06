import type { connectionsResources } from '~/drizzle'
import { memoize } from '@conar/shared/utils/helpers'
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
  'enum?': 'string',
  'isArray?': 'boolean',
  'editable?': 'boolean',
  'nullable': 'boolean | 1 | 0',
  'maxLength?': 'number | null',
  'precision?': 'number | null',
  'scale?': 'number | null',
})
  .pipe(({ editable, nullable, ...data }) => ({
    ...data,
    isEditable: Boolean(editable ?? true),
    isNullable: Boolean(nullable),
  }))

function getClickhouseColumnType(type: string) {
  if (type.startsWith('Enum')) {
    return type.match(/^Enum\d+/)?.[0] || 'Enum'
  }

  if (type.startsWith('Nullable(') && type.endsWith(')')) {
    return type.slice(9, -1)
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

export const resourceTableColumnsQuery = memoize(({ connectionResource, table, schema }: { connectionResource: typeof connectionsResources.$inferSelect, table: string, schema: string }) => {
  const query = createQuery({
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
          // TODO: handle enum name if data_type is ARRAY
          enum: data_type === 'USER-DEFINED' ? udt_name : undefined,
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
          enum: column.type === 'set' || column.type === 'enum' ? column.id : undefined,
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
          enum: column.type === 'set' || column.type === 'enum' ? name : undefined,
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
            sql<boolean>`true`.as('editable'),
          ])
          .where(({ and, eb }) => and([
            eb('table_schema', '=', schema),
            eb('table_name', '=', table),
          ]))
          .execute()

        return query.map(row => ({
          ...row,
          label: row.type,
          enum: row.type.includes('Enum') ? row.id : undefined,
          type: getClickhouseColumnType(row.type),
        }))
      },
    },
  })

  return queryOptions({
    queryKey: ['connection-resource', connectionResource.id, 'columns', schema, table],
    queryFn: () => query.run(connectionResourceToQueryParams(connectionResource)),
  })
})
