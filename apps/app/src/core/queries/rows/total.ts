import type { ActiveFilter } from '@tamery/shared/filters'
import { toKyselyFilter } from '@tamery/shared/filters'
import { queryOptions } from '@tanstack/react-query'
import { type } from 'arktype'
import { sql } from 'kysely'
import { memoize } from 'memoza'

import type { ConnectionResource } from '~/core/connection/sync'
import {
  connectionResourceToQueryParams,
  createQuery,
} from '~/core/runtime/query'

import type { ColumnTypes } from './shape'
import { clickhouseFilterValues } from './shape'

export const resourceTableTotalQuery = memoize(
  ({
    columns,
    table,
    schema,
    query: { filters, exact },
  }: {
    /** The table's columns, whose types ClickHouse parses filter values by. */
    columns?: ColumnTypes
    table: string
    schema: string
    query: {
      filters: ActiveFilter[]
      exact: boolean
    }
  }) =>
    createQuery({
      query: {
        clickhouse: async (db) => {
          if (!exact && !filters?.length) {
            const estimate = await db
              .selectFrom('system.parts')
              .select(db.fn.sum(sql.ref('rows')).as('count'))
              .where('database', '=', schema)
              .where('table', '=', table)
              .where('active', '=', 1)
              .executeTakeFirst()

            if (estimate && Number(estimate.count) > 0) {
              return { count: Number(estimate.count), isEstimated: true }
            }
          }

          const query = await db
            .withSchema(schema)
            .$extendTables<{ [table]: Record<string, unknown> }>()
            .selectFrom(table)
            .select(db.fn.countAll().as('total'))
            .where((eb) =>
              toKyselyFilter(
                eb,
                filters,
                'AND',
                clickhouseFilterValues(columns)
              )
            )
            .executeTakeFirst()

          return { count: Number(query?.total ?? 0), isEstimated: false }
        },
        mssql: async (db) => {
          const query = await db
            .withSchema(schema)
            .$extendTables<{ [table]: Record<string, unknown> }>()
            .selectFrom(table)
            .select(sql<number>`count_big(*)`.as('total'))
            .where((eb) => toKyselyFilter(eb, filters))
            .executeTakeFirst()

          return {
            count: Number(query?.total ?? 0),
            isEstimated: false,
          }
        },
        mysql: async (db) => {
          if (!exact && !filters?.length) {
            const estimate = await db
              .selectFrom('information_schema.TABLES')
              .select('TABLE_ROWS as count')
              .where('TABLE_SCHEMA', '=', schema)
              .where('TABLE_NAME', '=', table)
              .executeTakeFirst()

            if (estimate && estimate.count !== null && estimate.count > 0) {
              return { count: estimate.count, isEstimated: true }
            }
          }

          const query = await db
            .withSchema(schema)
            .$extendTables<{ [table]: Record<string, unknown> }>()
            .selectFrom(table)
            .select(db.fn.countAll().as('total'))
            .where((eb) => toKyselyFilter(eb, filters))
            .executeTakeFirst()

          return { count: Number(query?.total ?? 0), isEstimated: false }
        },
        postgres: async (db) => {
          if (!exact && !filters?.length) {
            const estimate = await db
              .selectFrom('pg_catalog.pg_class')
              .innerJoin(
                'pg_catalog.pg_namespace',
                'pg_catalog.pg_namespace.oid',
                'pg_catalog.pg_class.relnamespace'
              )
              .select('pg_catalog.pg_class.reltuples as count')
              .where('pg_catalog.pg_namespace.nspname', '=', schema)
              .where('pg_catalog.pg_class.relname', '=', table)
              .executeTakeFirst()

            if (estimate && estimate.count !== null && estimate.count > 0) {
              return {
                count: Math.round(estimate.count),
                isEstimated: true,
              }
            }
          }

          const query = await db
            .withSchema(schema)
            .$extendTables<{ [table]: Record<string, unknown> }>()
            .selectFrom(table)
            .select(db.fn.countAll().as('total'))
            .where((eb) => toKyselyFilter(eb, filters))
            .executeTakeFirst()

          return { count: Number(query?.total ?? 0), isEstimated: false }
        },
      },
      type: type({
        count: 'number',
        isEstimated: 'boolean',
      }),
    })
)

export const resourceTableTotalQueryKey = ({
  connectionResource,
  table,
  schema,
}: {
  connectionResource: ConnectionResource
  table: string
  schema: string
}) => [
  'connection-resource',
  connectionResource.id,
  'schema',
  schema,
  'table',
  table,
  'total',
]

export const resourceTableTotalQueryOptions = ({
  columns,
  connectionResource,
  table,
  schema,
  query: { filters, exact },
}: {
  columns?: ColumnTypes
  connectionResource: ConnectionResource
  table: string
  schema: string
  query: { filters: ActiveFilter[]; exact: boolean }
}) =>
  queryOptions({
    queryFn: async () =>
      resourceTableTotalQuery({
        columns,
        query: { exact, filters },
        schema,
        table,
      }).run(await connectionResourceToQueryParams(connectionResource)),
    queryKey: [
      ...resourceTableTotalQueryKey({ connectionResource, schema, table }),
      {
        exact,
        filters,
      },
    ],
    throwOnError: false,
  })
