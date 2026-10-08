import { queryOptions } from '@tanstack/react-query'
import { type } from 'arktype'
import { sql } from 'kysely'
import { memoize } from 'memoza'

import { capabilitiesOf, defaultSchemaOf } from '~/core/catalog/capabilities'
import { getConnectionResourceStore } from '~/core/connection/stores'
import type { ConnectionResource } from '~/core/connection/sync'
import {
  connectionResourceToQueryParams,
  createQuery,
} from '~/core/runtime/query'

// SQL Server gives every fixed database role (db_owner, db_datareader, …) a schema of its own, numbered from here up.
const MSSQL_FIRST_FIXED_ROLE_SCHEMA_ID = 16_384

const CLICKHOUSE_MATERIALIZED_VIEW_STORAGE = '.inner%'

const tableTypes = ['base table', 'view', 'materialized view'] as const

export type RelationKind = 'table' | 'view'

// Every dialect with schemas reads from its schema catalog, so an empty schema is one row whose table is null.
export const tablesAndSchemasType = type({
  comment: 'string | null',
  'row_level_security?': 'boolean | null',
  schema: 'string',
  table: 'string | null',
  type: type.or(
    type.enumerated(...tableTypes),
    type.enumerated(
      ...(tableTypes.map((t) => t.toUpperCase()) as Uppercase<
        (typeof tableTypes)[number]
      >[])
    )
  ),
}).pipe(({ row_level_security: rowLevelSecurity, type: rawType, ...props }) => {
  const formattedType = rawType.toLowerCase() as (typeof tableTypes)[number]
  return {
    ...props,
    rowLevelSecurity: rowLevelSecurity ?? undefined,
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
                  .fn<string | null>('nullIf', ['comment', eb.val('')])
                  .as('comment'),
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
            .where('name', 'not like', CLICKHOUSE_MATERIALIZED_VIEW_STORAGE)
            .execute(),
        // information_schema cannot tell the tables SQL Server ships in master
        // (spt_*, MSreplication_options) from the user's own.
        mssql: (db) =>
          db
            .selectFrom('sys.schemas as s')
            .leftJoin('sys.objects as o', (join) =>
              join
                .onRef('o.schema_id', '=', 's.schema_id')
                .on('o.type', 'in', ['U', 'V'])
                .on('o.is_ms_shipped', '=', false)
            )
            .leftJoin('sys.extended_properties as ep', (join) =>
              join
                .onRef('ep.major_id', '=', 'o.object_id')
                .on('ep.minor_id', '=', 0)
                .on('ep.class', '=', 1)
                .on('ep.name', '=', 'MS_Description')
            )
            .select([
              's.name as schema',
              'o.name as table',
              sql<
                string | null
              >`NULLIF(CAST(ep.value AS nvarchar(max)), '')`.as('comment'),
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
            .where('s.schema_id', '<', MSSQL_FIRST_FIXED_ROLE_SCHEMA_ID)
            .execute(),
        mysql: (db) =>
          db
            .selectFrom('information_schema.SCHEMATA as s')
            .leftJoin('information_schema.TABLES as t', (join) =>
              join
                .onRef('t.TABLE_SCHEMA', '=', 's.SCHEMA_NAME')
                .on('t.TABLE_TYPE', 'in', ['BASE TABLE', 'VIEW'])
            )
            .select([
              's.SCHEMA_NAME as schema',
              't.TABLE_NAME as table',
              // A view's TABLE_COMMENT is the word VIEW, not a comment.
              (eb) =>
                eb
                  .case()
                  .when('t.TABLE_TYPE', '=', 'BASE TABLE')
                  .then(
                    eb.fn<string | null>('nullif', [
                      't.TABLE_COMMENT',
                      eb.val(''),
                    ])
                  )
                  .end()
                  .as('comment'),
              (eb) =>
                eb.fn.coalesce('t.TABLE_TYPE', eb.val('BASE TABLE')).as('type'),
            ])
            .$narrowType<{ type: 'BASE TABLE' | 'VIEW' }>()
            .execute(),
        postgres: (db) =>
          db
            .selectFrom('pg_catalog.pg_namespace as n')
            .leftJoin('pg_catalog.pg_class as c', (join) =>
              join
                .onRef('c.relnamespace', '=', 'n.oid')
                .on('c.relkind', 'in', ['r', 'p', 'v', 'm'])
            )
            .select([
              'n.nspname as schema',
              'c.relname as table',
              'c.relrowsecurity as row_level_security',
              (eb) =>
                eb
                  .fn<string | null>('obj_description', [
                    'c.oid',
                    eb.val('pg_class'),
                  ])
                  .as('comment'),
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
          tables: tables.flatMap((table) =>
            table.table === null
              ? []
              : [
                  {
                    comment: table.comment ?? undefined,
                    name: table.table,
                    rowLevelSecurity: table.rowLevelSecurity,
                    type: table.type,
                  },
                ]
          ),
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
