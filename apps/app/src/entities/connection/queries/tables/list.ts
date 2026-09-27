import { queryOptions } from '@tanstack/react-query'
import { type } from 'arktype'
import { memoize } from 'memoza'

import {
  capabilitiesOf,
  defaultSchemaOf,
} from '~/entities/connection/capabilities'
import type { ConnectionResource } from '~/entities/connection/core/sync'

import {
  connectionResourceToQueryParams,
  createQuery,
} from '../../runtime/query'
import { getConnectionResourceStore } from '../../store/stores'

const tableTypes = ['base table', 'view', 'materialized view'] as const

export type RelationKind = 'table' | 'view'

export const tablesAndSchemasType = type({
  'rowLevelSecurity?': 'boolean',
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
  ({ database }: { database: string | null }) =>
    createQuery({
      query: {
        clickhouse: (db) =>
          db
            .selectFrom('system.tables')
            .select([
              'database as schema',
              'name as table',
              (eb) =>
                eb
                  .case()
                  .when('engine', '=', 'MaterializedView')
                  .then('materialized view')
                  .when('engine', 'ilike', '%View%')
                  .then('view')
                  .else('base table')
                  .end()
                  .as('type'),
            ])
            .$narrowType<{
              type: 'base table' | 'materialized view' | 'view'
            }>()
            .where('database', '=', database)
            .where('is_temporary', '=', 0)
            .execute(),
        // information_schema cannot tell the tables SQL Server ships in master
        // (spt_*, MSreplication_options) from the user's own.
        mssql: (db) =>
          db
            .selectFrom('sys.objects as o')
            .innerJoin('sys.schemas as s', 's.schema_id', 'o.schema_id')
            .select([
              's.name as schema',
              'o.name as table',
              (eb) =>
                eb
                  .case()
                  .when('o.type', '=', 'V')
                  .then('VIEW')
                  .else('BASE TABLE')
                  .end()
                  .as('type'),
            ])
            .$narrowType<{ type: 'BASE TABLE' | 'VIEW' }>()
            .where('o.type', 'in', ['U', 'V'])
            .where('o.is_ms_shipped', '=', false)
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
              'c.relrowsecurity as rowLevelSecurity',
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
            .execute(),
      },
      type: tablesAndSchemasType.array(),
    })
)

export const resourceTablesAndSchemasQueryOptions = ({
  connectionResource,
}: {
  connectionResource: ConnectionResource
}) =>
  queryOptions({
    // The key changes only between resources, so the global keepPreviousData would show the previous connection's tables.
    placeholderData: undefined,
    queryFn: async () => {
      const params = await connectionResourceToQueryParams(connectionResource)
      const { systemSchemas } = capabilitiesOf(params.type)
      const results = await resourceTablesAndSchemasQuery({
        database: connectionResource.name,
      }).run(params)
      const bySchema = Object.groupBy(results, (table) => table.schema)
      const defaultSchema = defaultSchemaOf(
        params.type,
        connectionResource.name
      )

      if (defaultSchema) {
        bySchema[defaultSchema] ??= []
      }
      const { showSystem } = getConnectionResourceStore(
        connectionResource.id
      ).get()
      const schemas = Object.entries(bySchema)
        .filter(([schema]) => showSystem || !systemSchemas.includes(schema))
        .map(([schema, tables = []]) => ({
          name: schema,
          tables: tables.map((table) => ({
            name: table.table,
            rowLevelSecurity: table.rowLevelSecurity,
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
      }
    },
    queryKey: [
      'connection-resource',
      connectionResource.id,
      'tables-and-schemas',
    ],
  })
