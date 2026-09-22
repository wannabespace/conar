import { queryOptions } from '@tanstack/react-query'
import { type } from 'arktype'
import { sql } from 'kysely'
import { memoize } from 'memoza'

import type { ConnectionResource } from '~/entities/connection/core/sync'

import {
  connectionResourceToQueryParams,
  createQuery,
} from '../../runtime/query'

const tableTypes = ['base table', 'view', 'materialized view'] as const

export const tablesAndSchemasType = type({
  schema: 'string',
  table: 'string',
  type: type.or(
    type.enumerated(...tableTypes),
    type.enumerated(
      ...(tableTypes.map((t) => t.toUpperCase()) as Uppercase<
        (typeof tableTypes)[number]
      >[])
    )
  ),
}).pipe(({ type: rawType, ...props }) => {
  const formattedType = rawType.toLowerCase() as (typeof tableTypes)[number]
  return {
    ...props,
    type: formattedType === 'base table' ? ('table' as const) : formattedType,
  }
})

export const resourceTablesAndSchemasQuery = memoize(
  ({
    database,
    showSystem,
  }: {
    database: string | null
    showSystem: boolean
  }) =>
    createQuery({
      query: {
        clickhouse: (db) =>
          db
            .selectFrom('system.tables')
            .select([
              'database as schema',
              'name as table',
              sql<'base table' | 'materialized view' | 'view'>`CASE
                WHEN engine = 'MaterializedView' THEN 'materialized view'
                WHEN engine ILIKE '%View%' THEN 'view'
                ELSE 'base table'
              END`.as('type'),
            ])
            .where('database', '=', database)
            .where('is_temporary', '=', 0)
            .execute(),
        mssql: (db) =>
          db
            .selectFrom('information_schema.TABLES')
            .select([
              'TABLE_SCHEMA as schema',
              'TABLE_NAME as table',
              'TABLE_TYPE as type',
            ])
            .where('TABLE_TYPE', 'in', ['BASE TABLE', 'VIEW'])
            .$if(!showSystem, (qb) =>
              qb.where('TABLE_SCHEMA', 'not in', ['sys', 'INFORMATION_SCHEMA'])
            )
            .execute(),
        mysql: (db) =>
          db
            .selectFrom('information_schema.TABLES')
            .select([
              'TABLE_SCHEMA as schema',
              'TABLE_NAME as table',
              'TABLE_TYPE as type',
            ])
            .where('TABLE_TYPE', 'in', ['BASE TABLE', 'VIEW'])
            .$narrowType<{ type: 'BASE TABLE' | 'VIEW' }>()
            .$if(!showSystem, (qb) =>
              qb.where((eb) =>
                eb('TABLE_SCHEMA', 'not in', [
                  'mysql',
                  'information_schema',
                  'performance_schema',
                  'sys',
                ])
              )
            )
            .execute(),
        postgres: (db) =>
          db
            .selectFrom('pg_catalog.pg_class as c')
            .innerJoin(
              'pg_catalog.pg_namespace as n',
              'n.oid',
              'c.relnamespace'
            )
            .select([
              'n.nspname as schema',
              'c.relname as table',
              (eb) =>
                eb
                  .case('c.relkind')
                  .when('v')
                  .then('view')
                  .when('m')
                  .then('materialized view')
                  .else('base table')
                  .end()
                  .as('type'),
            ])
            .$narrowType<{
              type: 'base table' | 'materialized view' | 'view'
            }>()
            .where('c.relkind', 'in', ['r', 'p', 'v', 'm'])
            .where(({ eb, and, not }) =>
              and([
                not(eb('n.nspname', 'like', 'pg_toast%')),
                not(eb('n.nspname', 'like', 'pg_temp%')),
              ])
            )
            .$if(!showSystem, (qb) =>
              qb.where('n.nspname', 'not in', [
                'pg_catalog',
                'information_schema',
              ])
            )
            .execute(),
      },
      type: tablesAndSchemasType.array(),
    })
)

export const resourceTablesAndSchemasQueryOptions = ({
  connectionResource,
  showSystem,
}: {
  connectionResource: ConnectionResource
  showSystem: boolean
}) =>
  queryOptions({
    placeholderData: (previousData, previousQuery) =>
      previousQuery?.queryKey[1] === connectionResource.id
        ? previousData
        : undefined,
    queryFn: async () => {
      const results = await resourceTablesAndSchemasQuery({
        database: connectionResource.name,
        showSystem,
      }).run(await connectionResourceToQueryParams(connectionResource))
      const schemas = Object.entries(
        Object.groupBy(results, (table) => table.schema)
      ).map(([schema, tables = []]) => ({
        name: schema,
        tables: tables.map((table) => ({
          name: table.table,
          type: table.type,
        })),
      }))

      return {
        schemas: schemas.toSorted((a, b) => {
          if (a.name === 'public' && b.name !== 'public') {
            return -1
          }
          if (b.name === 'public' && a.name !== 'public') {
            return 1
          }
          return a.name.localeCompare(b.name)
        }),
        totalSchemas: schemas.length,
        totalTables: schemas.reduce(
          (acc, schema) => acc + schema.tables.length,
          0
        ),
      }
    },
    queryKey: [
      'connection-resource',
      connectionResource.id,
      'tables-and-schemas',
      showSystem,
    ],
  })
