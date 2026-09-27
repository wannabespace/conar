import { queryOptions } from '@tanstack/react-query'
import { type } from 'arktype'

import type { ConnectionResource } from '../../core/sync'
import {
  connectionResourceToQueryParams,
  createQuery,
} from '../../runtime/query'

export const enumType = type({
  metadata: type({
    'charset?': 'string | null',
    'collation?': 'string | null',
    column: 'string?',
    'comment?': 'string',
    'default?': 'string | null',
    isSet: 'boolean?',
    'nullable?': 'boolean',
    table: 'string?',
  }).optional(),
  name: 'string',
  schema: 'string',
  values: 'string[]',
})

export const findEnum = ({
  enums,
  column,
  table,
}: {
  enums: (typeof enumType.infer)[]
  column: {
    id: string
    enumName?: string
    type?: string
  }
  table: string
}) =>
  enums.find(
    (e) => e.metadata?.table === table && e.metadata?.column === column.id
  ) ??
  enums.find(
    (e) =>
      (column.enumName && e.name === column.enumName) ||
      (column.type && e.name === column.type)
  )

const clickhouseQuotedRegex = /'(?<value>(?:[^'\\]|\\.)*)'/gu
const clickhouseEscapeRegex = /\\(?<char>.)/gu

const parseClickhouseEnum = (dataType: string) =>
  Array.from(dataType.matchAll(clickhouseQuotedRegex), (match) =>
    (match.groups?.value ?? '').replaceAll(clickhouseEscapeRegex, '$1')
  )

const mysqlQuotedRegex = /'(?<value>(?:[^']|'')*)'/gu

const parseMysqlEnumOrSet = (columnType: string) =>
  Array.from(columnType.matchAll(mysqlQuotedRegex), (match) =>
    (match.groups?.value ?? '').replaceAll("''", "'")
  )

const resourceEnumsQuery = createQuery({
  query: {
    clickhouse: async (db) => {
      const query = await db
        .selectFrom('information_schema.columns')
        .select([
          'table_schema as schema',
          'table_name as table',
          'column_name as name',
          'data_type as type',
        ])
        .where(({ and, eb }) =>
          and([
            eb('table_schema', 'not in', [
              'INFORMATION_SCHEMA',
              'information_schema',
              'system',
            ]),
            eb('data_type', 'ilike', '%Enum%'),
          ])
        )
        .execute()

      return query
        .map(
          (row) =>
            ({
              metadata: {
                column: row.name,
                table: row.table,
              },
              name: row.name,
              schema: row.schema,
              values: parseClickhouseEnum(row.type),
            }) satisfies typeof enumType.infer
        )
        .filter((res) => res.values.length > 0)
    },
    mssql: () => Promise.resolve([]),
    mysql: async (db) => {
      const query = await db
        .selectFrom('information_schema.COLUMNS')
        .select([
          'TABLE_SCHEMA as schema',
          'TABLE_NAME as table',
          'COLUMN_TYPE as value',
          'COLUMN_NAME as name',
          'DATA_TYPE as data_type',
          'IS_NULLABLE as nullable',
          'COLUMN_DEFAULT as default',
          'COLUMN_COMMENT as comment',
          'CHARACTER_SET_NAME as charset',
          'COLLATION_NAME as collation',
        ])
        .where(({ or, and, eb }) =>
          and([
            eb('TABLE_SCHEMA', 'not in', [
              'mysql',
              'information_schema',
              'performance_schema',
              'sys',
            ]),
            or([eb('DATA_TYPE', '=', 'enum'), eb('DATA_TYPE', '=', 'set')]),
          ])
        )
        .execute()

      return query.map(
        (row) =>
          ({
            metadata: {
              charset: row.charset,
              collation: row.collation,
              column: row.name,
              comment: row.comment,
              default: row.default,
              isSet: row.data_type === 'set',
              nullable: row.nullable === 'YES',
              table: row.table,
            },
            name: row.name,
            schema: row.schema,
            values: parseMysqlEnumOrSet(row.value),
          }) satisfies typeof enumType.infer
      )
    },
    postgres: async (db) => {
      const query = await db
        .selectFrom('pg_type')
        .innerJoin('pg_enum', 'pg_type.oid', 'pg_enum.enumtypid')
        .innerJoin(
          'pg_catalog.pg_namespace',
          'pg_type.typnamespace',
          'pg_catalog.pg_namespace.oid'
        )
        .select([
          'pg_catalog.pg_namespace.nspname as schema',
          'pg_type.typname as name',
          'pg_enum.enumlabel as value',
        ])
        .where('pg_catalog.pg_namespace.nspname', 'not in', [
          'pg_catalog',
          'information_schema',
        ])
        .orderBy('pg_enum.enumsortorder')
        .execute()

      const grouped = new Map<string, typeof enumType.infer>()

      for (const row of query) {
        const key = `${row.schema}.${row.name}`
        const existing = grouped.get(key)
        if (existing) {
          existing.values.push(row.value)
        } else {
          grouped.set(key, {
            name: row.name,
            schema: row.schema,
            values: [row.value],
          })
        }
      }

      return [...grouped.values()]
    },
  },
  type: enumType.array(),
})

export const resourceEnumsQueryOptions = ({
  connectionResource,
}: {
  connectionResource: ConnectionResource
}) =>
  queryOptions({
    queryFn: async () =>
      resourceEnumsQuery.run(
        await connectionResourceToQueryParams(connectionResource)
      ),
    queryKey: ['connection-resource', connectionResource.id, 'enums'],
  })
