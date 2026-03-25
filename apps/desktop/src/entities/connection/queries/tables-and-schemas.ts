import type { connectionsResources } from '~/drizzle/schema'
import { memoize } from '@conar/shared/utils/helpers'
import { queryOptions } from '@tanstack/react-query'
import { type } from 'arktype'
import { connectionResourceToQueryParams, createQuery } from '../query'

export const tablesAndSchemasType = type({
  schema: 'string',
  table: 'string',
  type: '\'BASE TABLE\' | \'VIEW\'',
})

export const resourceTablesAndSchemasQuery = memoize(({ silent, connectionResource, showSystem }: { silent: boolean, connectionResource: typeof connectionsResources.$inferSelect, showSystem: boolean }) => {
  return createQuery({
    type: tablesAndSchemasType.array(),
    silent,
    query: {
      postgres: db => db
        .selectFrom('information_schema.tables')
        .select([
          'table_schema as schema',
          'table_name as table',
          'table_type as type',
        ])
        .where(({ eb, and, not }) => and([
          not(eb('table_schema', 'like', 'pg_toast%')),
          not(eb('table_schema', 'like', 'pg_temp%')),
          eb('table_type', 'in', ['BASE TABLE', 'VIEW']),
        ]))
        .$if(!showSystem, qb => qb.where(({ eb, and }) => and([
          eb('table_schema', 'not in', ['pg_catalog', 'information_schema']),
        ])))
        .execute(),
      mysql: db => db
        .selectFrom('information_schema.TABLES')
        .select([
          'TABLE_SCHEMA as schema',
          'TABLE_NAME as table',
          'TABLE_TYPE as type',
        ])
        .where('TABLE_TYPE', 'in', ['BASE TABLE', 'VIEW'])
        .$castTo<{ schema: string, table: string, type: 'BASE TABLE' | 'VIEW' }>()
        .$if(!showSystem, qb => qb.where(eb => eb('TABLE_SCHEMA', 'not in', ['mysql', 'information_schema', 'performance_schema', 'sys'])))
        .execute(),
      mssql: db => db
        .selectFrom('information_schema.TABLES')
        .select([
          'TABLE_SCHEMA as schema',
          'TABLE_NAME as table',
          'TABLE_TYPE as type',
        ])
        .where('TABLE_TYPE', 'in', ['BASE TABLE', 'VIEW'])
        .execute(),
      clickhouse: db => db
        .selectFrom('information_schema.tables')
        .select([
          'table_schema as schema',
          'table_name as table',
          'table_type as type',
        ])
        .where('table_type', 'in', ['BASE TABLE', 'VIEW'])
        .$castTo<{ schema: string, table: string, type: 'BASE TABLE' | 'VIEW' }>()
        .where('table_schema', '=', connectionResource.name)
        .execute(),
    },
  })
})

export function resourceTablesAndSchemasQueryOptions({ silent, connectionResource, showSystem }: { silent: boolean, connectionResource: typeof connectionsResources.$inferSelect, showSystem: boolean }) {
  return queryOptions({
    queryKey: ['connection-resource', connectionResource.id, 'tables-and-schemas', showSystem],
    queryFn: async () => {
      const results = await resourceTablesAndSchemasQuery({ silent, connectionResource, showSystem }).run(connectionResourceToQueryParams(connectionResource))
      const schemas = Object.entries(Object.groupBy(results, table => table.schema)).map(([schema, tables]) => ({
        name: schema,
        tables: tables!.map(table => ({ name: table.table, isView: table.type === 'VIEW' })),
      }))

      return {
        totalSchemas: schemas.length,
        totalTables: schemas.reduce((acc, schema) => acc + schema.tables.length, 0),
        schemas: schemas.toSorted((a, b) => {
          if (a.name === 'public' && b.name !== 'public')
            return -1
          if (b.name === 'public' && a.name !== 'public')
            return 1
          return a.name.localeCompare(b.name)
        }),
      }
    },
  })
}
