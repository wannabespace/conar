import { queryOptions } from '@tanstack/react-query'
import { type } from 'arktype'
import { sql } from 'kysely'
import { memoize } from 'memoza'

import type { ConnectionResource } from '~/core/connection/sync'
import {
  connectionResourceToQueryParams,
  createQuery,
} from '~/core/runtime/query'

import type { ColumnsFilter } from './dialect-columns'
import { mysqlColumns, postgresColumns } from './dialect-columns'

export const columnType = type({
  // MySQL: the clauses a MODIFY COLUMN drops unless it repeats them.
  'attributes?': 'string',
  'collation?': 'string | null',
  // Full type as a DDL statement spells it, length and precision included.
  'declaredType?': 'string | null',
  default: 'string | null',
  'editable?': 'boolean | 1 | 0',
  'enumName?': 'string',
  id: 'string',
  'isArray?': 'boolean',
  'isGenerated?': 'boolean | number | null',
  'isIdentity?': 'boolean | number | null',
  'maxLength?': 'number | null',
  nullable: 'boolean | 1 | 0',
  'precision?': 'number | null',
  'scale?': 'number | null',
  schema: 'string',
  table: 'string',
  type: 'string',
  'typeLabel?': 'string',
}).pipe(
  ({ typeLabel, editable, nullable, isGenerated, isIdentity, ...data }) => ({
    ...data,
    isEditable: Boolean(editable ?? true),
    isGenerated: Boolean(isGenerated),
    isIdentity: Boolean(isIdentity),
    isNullable: Boolean(nullable),
    typeLabel: typeLabel ?? data.type,
  })
)

const clickhouseEnumRegex = /^Enum\d+/u

const clickhouseNullableRegex = /^(?:LowCardinality\()?Nullable\(/u

const clickhouseWithoutNullable = (sqlType: string) =>
  sqlType.replace(
    /^(?<wrapper>LowCardinality\()?Nullable\((?<inner>.*)\)$/u,
    '$<wrapper>$<inner>'
  )

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

const columnsQuery = memoize((filter: ColumnsFilter) =>
  createQuery({
    query: {
      clickhouse: async (db) => {
        const query = await db
          .selectFrom('system.columns')
          .select([
            'database as schema',
            'table',
            'name as id',
            'default_expression as default',
            'type',
            sql<boolean>`default_kind IN ('MATERIALIZED', 'ALIAS')`.as(
              'isGenerated'
            ),
            // ClickHouse refuses to UPDATE a sorting or primary key column.
            sql<boolean>`default_kind NOT IN ('MATERIALIZED', 'ALIAS') AND NOT is_in_sorting_key AND NOT is_in_primary_key`.as(
              'editable'
            ),
          ])
          .$call((qb) =>
            filter
              ? qb.where(({ and, eb }) =>
                  and([
                    eb('database', '=', filter.schema),
                    eb('table', '=', filter.table),
                  ])
                )
              : qb.where('database', 'not in', ['system', 'information_schema'])
          )
          .orderBy('database')
          .orderBy('table')
          .orderBy('position')
          .execute()

        return query.map((row) => ({
          ...row,
          declaredType: clickhouseWithoutNullable(row.type),
          enumName: row.type.includes('Enum') ? row.id : undefined,
          isArray: row.type.includes('Array('),
          nullable: clickhouseNullableRegex.test(row.type),
          typeLabel: getClickhouseColumnType(row.type),
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
            'COLLATION_NAME as collation',
            eb
              .case()
              .when('DATA_TYPE', 'in', [
                'binary',
                'char',
                'nchar',
                'nvarchar',
                'varbinary',
                'varchar',
              ])
              .then(
                sql<string>`DATA_TYPE + '(' + IIF(CHARACTER_MAXIMUM_LENGTH = -1, 'max', CAST(CHARACTER_MAXIMUM_LENGTH AS varchar(10))) + ')'`
              )
              .when('DATA_TYPE', 'in', ['decimal', 'numeric'])
              .then(
                sql<string>`DATA_TYPE + '(' + CAST(NUMERIC_PRECISION AS varchar(10)) + ', ' + CAST(NUMERIC_SCALE AS varchar(10)) + ')'`
              )
              .when('DATA_TYPE', 'in', ['datetime2', 'datetimeoffset', 'time'])
              .then(
                sql<string>`DATA_TYPE + '(' + CAST(DATETIME_PRECISION AS varchar(10)) + ')'`
              )
              .else(eb.ref('DATA_TYPE'))
              .end()
              .as('declaredType'),
            sql<number | null>`
              CASE WHEN DATA_TYPE IN ('timestamp', 'rowversion')
                OR COLUMNPROPERTY(OBJECT_ID(QUOTENAME(TABLE_SCHEMA) + '.' + QUOTENAME(TABLE_NAME)), COLUMN_NAME, 'IsIdentity') = 1
                OR COLUMNPROPERTY(OBJECT_ID(QUOTENAME(TABLE_SCHEMA) + '.' + QUOTENAME(TABLE_NAME)), COLUMN_NAME, 'IsComputed') = 1
              THEN 1 ELSE 0 END
            `.as('isGenerated'),
            sql<number | null>`
              COLUMNPROPERTY(
                OBJECT_ID(QUOTENAME(TABLE_SCHEMA) + '.' + QUOTENAME(TABLE_NAME)),
                COLUMN_NAME,
                'IsIdentity'
              )
            `.as('isIdentity'),
            sql<1 | 0>`IIF(IS_NULLABLE = 'YES', 1, 0)`.as('nullable'),
          ])
          .$call((qb) =>
            filter
              ? qb.where(({ and, eb }) =>
                  and([
                    eb('TABLE_SCHEMA', '=', filter.schema),
                    eb('TABLE_NAME', '=', filter.table),
                  ])
                )
              : qb.where('TABLE_SCHEMA', 'not in', [
                  'sys',
                  'INFORMATION_SCHEMA',
                ])
          )
          .orderBy('TABLE_SCHEMA')
          .orderBy('TABLE_NAME')
          .orderBy('ORDINAL_POSITION')
          .execute()

        return query.map(
          ({ name, ...column }) =>
            ({
              ...column,
              // Identity, computed and rowversion columns all refuse an UPDATE.
              editable: !column.isGenerated,
              id: name,
              maxLength: column.max_length,
            }) satisfies typeof columnType.inferIn
        )
      },
      mysql: (db) => mysqlColumns(db, filter),
      postgres: (db) => postgresColumns(db, filter),
    },
    type: columnType.array(),
  })
)

export const resourceColumnsQueryKey = ({
  connectionResource,
}: {
  connectionResource: ConnectionResource
}) => ['connection-resource', connectionResource.id, 'columns']

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
      columnsQuery({ schema, table }).run(
        await connectionResourceToQueryParams(connectionResource)
      ),
    queryKey: [
      ...resourceColumnsQueryKey({ connectionResource }),
      schema,
      table,
    ],
  })

export const resourceColumnsQueryOptions = ({
  connectionResource,
}: {
  connectionResource: ConnectionResource
}) =>
  queryOptions({
    queryFn: async () =>
      columnsQuery(null).run(
        await connectionResourceToQueryParams(connectionResource)
      ),
    queryKey: [...resourceColumnsQueryKey({ connectionResource }), 'all'],
  })

export const resourceTableColumnIdsQueryOptions = (
  params: Parameters<typeof resourceTableColumnsQueryOptions>[0]
) => ({
  ...resourceTableColumnsQueryOptions(params),
  select: (columns: (typeof columnType.infer)[]) =>
    columns.map((column) => column.id),
})
