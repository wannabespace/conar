import { queryOptions } from '@tanstack/react-query'
import { type } from 'arktype'

import type { ConnectionResource } from '~/core/connection/sync'
import {
  clickhouseEnumEntries,
  mysqlQuotedValues,
} from '~/core/queries/shared/inline-enum'
import {
  connectionResourceToQueryParams,
  createQuery,
} from '~/core/runtime/query'

export const enumType = type({
  metadata: type({
    column: 'string?',
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
              values: clickhouseEnumEntries(row.type).map(
                (entry) => entry.value
              ),
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
              column: row.name,
              table: row.table,
            },
            name: row.name,
            schema: row.schema,
            values: mysqlQuotedValues(row.value),
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
