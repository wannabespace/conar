import { queryOptions } from '@tanstack/react-query'
import { type } from 'arktype'
import { memoize } from 'memoza'

import type { ConnectionResource } from '~/entities/connection/core'

import { connectionResourceToQueryParams, createQuery } from '../runtime/query'

const tableTypes = ['base table', 'view', 'materialized view'] as const

export const tablesAndSchemasType = type({
  schema: 'string',
  table: 'string',
  type: type.or(
    type.enumerated(...tableTypes),
    // SAFETY: mapping `toUpperCase` over the literal tuple produces exactly its
    // uppercase counterparts; TS widens the result to string[] on its own.
    type.enumerated(
      ...(tableTypes.map((t) => t.toUpperCase()) as Uppercase<
        (typeof tableTypes)[number]
      >[])
    )
  ),
}).pipe(({ type: rawType, ...props }) => {
  // SAFETY: the schema above accepts only `tableTypes` or their uppercase
  // spellings, so lowercasing always lands back inside the tuple.
  const formattedType = rawType.toLowerCase() as (typeof tableTypes)[number]
  return {
    ...props,
    type: formattedType === 'base table' ? ('table' as const) : formattedType,
  }
})

export const resourceTablesAndSchemasQuery = memoize(
  ({
    connectionResource,
    showSystem,
  }: {
    connectionResource: ConnectionResource
    showSystem: boolean
  }) =>
    createQuery({
      query: {
        clickhouse: (db) =>
          db
            .selectFrom('system.tables')
            .select((eb) => [
              'database as schema',
              'name as table',
              eb
                .case()
                .when('engine', '=', 'MaterializedView')
                // oxlint-disable-next-line promise/prefer-await-to-then -- Kysely case expression
                .then('materialized view' as const)
                .when('engine', 'ilike', '%View%')
                // oxlint-disable-next-line promise/prefer-await-to-then -- Kysely case expression
                .then('view' as const)
                .else('base table' as const)
                .end()
                .as('type'),
            ])
            .where('database', '=', connectionResource.name)
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
            .select((eb) => [
              'n.nspname as schema',
              'c.relname as table',
              eb
                .case('c.relkind')
                .when('v')
                // oxlint-disable-next-line promise/prefer-await-to-then -- Kysely case expression
                .then('view' as const)
                .when('m')
                // oxlint-disable-next-line promise/prefer-await-to-then -- Kysely case expression
                .then('materialized view' as const)
                .else('base table' as const)
                .end()
                .as('type'),
            ])
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
    queryFn: async () => {
      const results = await resourceTablesAndSchemasQuery({
        connectionResource,
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
