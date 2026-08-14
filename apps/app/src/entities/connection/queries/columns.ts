import { queryOptions } from '@tanstack/react-query'
import { type } from 'arktype'
import { sql } from 'kysely'
import { memoize } from 'memoza'

import type { ConnectionResource } from '../core/sync'
import { connectionResourceToQueryParams, createQuery } from '../runtime/query'

export const columnType = type({
  default: 'string | null',
  'editable?': 'boolean | 1 | 0',
  'enumName?': 'string',
  id: 'string',
  'isArray?': 'boolean',
  'isIdentity?': 'boolean | number',
  'maxLength?': 'number | null',
  nullable: 'boolean | 1 | 0',
  'precision?': 'number | null',
  'scale?': 'number | null',
  schema: 'string',
  table: 'string',
  type: 'string',
  'typeLabel?': 'string',
}).pipe(({ typeLabel, editable, nullable, isIdentity, ...data }) => ({
  ...data,
  isEditable: Boolean(editable ?? true),
  isIdentity: Boolean(isIdentity),
  isNullable: Boolean(nullable),
  typeLabel: typeLabel ?? data.type,
}))

const clickhouseEnumRegex = /^Enum\d+/u

const getClickhouseColumnType = (sqlType: string): string => {
  if (sqlType.startsWith('Array(') && sqlType.endsWith(')')) {
    return `${getClickhouseColumnType(sqlType.slice(6, -1))}[]`
  }

  if (sqlType.startsWith('Nullable(') && sqlType.endsWith(')')) {
    return getClickhouseColumnType(sqlType.slice(9, -1))
  }

  if (sqlType.startsWith('LowCardinality(') && sqlType.endsWith(')')) {
    return getClickhouseColumnType(sqlType.slice(15, -1))
  }

  if (sqlType.startsWith('Enum')) {
    return sqlType.match(clickhouseEnumRegex)?.[0] || 'Enum'
  }

  return sqlType
}

const getPgColumnType = (sqlType: string, udtName: string) => {
  if (sqlType === 'ARRAY') {
    return udtName.slice(1)
  } else if (sqlType === 'USER-DEFINED') {
    return udtName
  } else if (sqlType === 'character varying') {
    return 'varchar'
  } else if (sqlType === 'character') {
    return 'char'
  } else if (sqlType === 'bit varying') {
    return 'varbit'
  } else if (sqlType.startsWith('time')) {
    return udtName || sqlType
  }

  return sqlType
}

const resourceTableColumnsQuery = memoize(
  ({ table, schema }: { table: string; schema: string }) =>
    createQuery({
      query: {
        clickhouse: async (db) => {
          const query = await db
            .selectFrom('information_schema.columns')
            .select((eb) => [
              'table_schema as schema',
              'table_name as table',
              'column_name as id',
              'column_default as default',
              'data_type as type',
              eb
                .case('is_nullable')
                .when(1)
                .then(true)
                .else(false)
                .end()
                .as('nullable'),
            ])
            .where(({ and, eb }) =>
              and([
                eb('table_schema', '=', schema),
                eb('table_name', '=', table),
              ])
            )
            .execute()

          return query.map((row) => ({
            ...row,
            editable: true,
            enumName: row.type.includes('Enum') ? row.id : undefined,
            isArray: row.type.includes('Array('),
            label: getClickhouseColumnType(row.type),
          }))
        },
        mssql: async (db) => {
          const query = await db
            .selectFrom('information_schema.COLUMNS')
            .select((eb) => [
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
            .where(({ and, eb }) =>
              and([
                eb('TABLE_SCHEMA', '=', schema),
                eb('TABLE_NAME', '=', table),
              ])
            )
            .execute()

          return query.map(
            ({ name, ...column }) =>
              ({
                ...column,
                enumName:
                  column.type === 'set' || column.type === 'enum'
                    ? name
                    : undefined,
                id: name,
                isArray: column.type === 'set',
                maxLength: column.max_length,
              }) satisfies typeof columnType.inferIn
          )
        },
        mysql: async (db) => {
          const query = await db
            .selectFrom('information_schema.COLUMNS')
            .select((eb) => [
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
            .where(({ and, eb }) =>
              and([
                eb('TABLE_SCHEMA', '=', schema),
                eb('TABLE_NAME', '=', table),
              ])
            )
            .execute()

          return query.map(
            (column) =>
              ({
                ...column,
                enumName:
                  column.type === 'set' || column.type === 'enum'
                    ? column.id
                    : undefined,
                isArray: column.type === 'set',
                maxLength: column.max_length,
              }) satisfies typeof columnType.inferIn
          )
        },
        postgres: async (db) => {
          const query = await db
            .selectFrom('information_schema.columns')
            .select((eb) => [
              'table_schema as schema',
              'table_name as table',
              'column_name as id',
              'column_default as default',
              'data_type',
              'udt_name',
              'character_maximum_length as max_length',
              'numeric_precision as precision',
              'numeric_scale as scale',
              eb
                .case('is_nullable')
                .when('YES')
                .then(true)
                .else(false)
                .end()
                .as('nullable'),
              eb
                .case('is_updatable')
                .when('YES')
                .then(true)
                .else(false)
                .end()
                .as('editable'),
            ])
            .where(({ and, eb }) =>
              and([
                eb('table_schema', '=', schema),
                eb('table_name', '=', table),
              ])
            )
            .execute()

          // Materialized views do not have columns, fallback to pg_attribute
          if (query.length === 0) {
            const fallback = await db
              .selectFrom('pg_catalog.pg_attribute as a')
              .innerJoin('pg_catalog.pg_class as c', 'c.oid', 'a.attrelid')
              .innerJoin(
                'pg_catalog.pg_namespace as n',
                'n.oid',
                'c.relnamespace'
              )
              .leftJoin('pg_catalog.pg_attrdef as ad', (join) =>
                join
                  .onRef('ad.adrelid', '=', 'a.attrelid')
                  .onRef('ad.adnum', '=', 'a.attnum')
              )
              .select((eb) => [
                'n.nspname as schema',
                'c.relname as table',
                'a.attname as id',
                eb
                  .fn<string | null>('pg_get_expr', [
                    eb.ref('ad.adbin'),
                    eb.ref('ad.adrelid'),
                  ])
                  .as('default'),
                eb
                  .fn<string>('format_type', [
                    eb.ref('a.atttypid'),
                    eb.ref('a.atttypmod'),
                  ])
                  .as('type'),
                sql<boolean>`not a.attnotnull`.as('nullable'),
              ])
              .where(({ and, eb }) =>
                and([
                  eb('n.nspname', '=', schema),
                  eb('c.relname', '=', table),
                  eb('a.attnum', '>', 0),
                  eb('a.attisdropped', '=', false),
                  eb('c.relkind', 'in', ['r', 'p', 'v', 'm']),
                ])
              )
              .orderBy('a.attnum', 'asc')
              .execute()

            return fallback.map(
              (row) =>
                ({
                  ...row,
                  editable: false,
                  isArray: row.type.endsWith('[]'),
                  type: row.type.endsWith('[]')
                    ? row.type.slice(0, -2)
                    : row.type,
                }) satisfies typeof columnType.inferIn
            )
          }

          return query.map(({ data_type, udt_name, ...row }) => {
            let enumName: string | undefined
            if (data_type === 'USER-DEFINED') {
              enumName = udt_name
            } else if (data_type === 'ARRAY') {
              enumName = udt_name.slice(1)
            }

            return {
              ...row,
              enumName,
              isArray: data_type === 'ARRAY',
              maxLength: row.max_length,
              type:
                data_type === 'ARRAY' ? `${udt_name.slice(1)}[]` : data_type,
              typeLabel:
                data_type === 'ARRAY'
                  ? `${getPgColumnType(data_type, udt_name)}[]`
                  : getPgColumnType(data_type, udt_name),
            } satisfies typeof columnType.inferIn
          })
        },
      },
      type: columnType.array(),
    })
)

export const resourceTableColumnsQueryOptions = ({
  connectionResource,
  table,
  schema,
}: {
  connectionResource: ConnectionResource
  table: string
  schema: string
}) =>
  queryOptions({
    queryFn: async () =>
      resourceTableColumnsQuery({ schema, table }).run(
        await connectionResourceToQueryParams(connectionResource)
      ),
    queryKey: [
      'connection-resource',
      connectionResource.id,
      'columns',
      schema,
      table,
    ],
  })
