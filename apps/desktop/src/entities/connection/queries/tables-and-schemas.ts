import type { connectionsResources } from '~/drizzle'
import { ConnectionType } from '@conar/shared/enums/connection-type'
import { memoize } from '@conar/shared/utils/helpers'
import { queryOptions } from '@tanstack/react-query'
import { type } from 'arktype'
import { connectionResourceToQueryParams, createQuery } from '../query'

export const connectionSystemNames = {
  [ConnectionType.Postgres]: 'postgres',
  [ConnectionType.MySQL]: 'mysql',
  [ConnectionType.MSSQL]: 'master',
  [ConnectionType.ClickHouse]: 'default',
} satisfies Record<ConnectionType, string>

export const tablesAndSchemasType = type({
  schema: 'string',
  table: 'string',
})

export const resourceTablesAndSchemasQuery = memoize(({ silent = false, connectionResource, showSystem }: { silent?: boolean, connectionResource: typeof connectionsResources.$inferSelect, showSystem: boolean }) => {
  const query = createQuery({
    type: tablesAndSchemasType.array(),
    silent,
    query: {
      postgres: db => db
        .selectFrom('information_schema.tables')
        .select([
          'table_schema as schema',
          'table_name as table',
        ])
        .where(({ eb, and, not }) => and([
          not(eb('table_schema', 'like', 'pg_toast%')),
          not(eb('table_schema', 'like', 'pg_temp%')),
          eb('table_type', '=', 'BASE TABLE'),
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
        ])
        .where('TABLE_TYPE', '=', 'BASE TABLE')
        .$if(!showSystem, qb => qb.where(eb => eb('TABLE_SCHEMA', 'not in', ['mysql', 'information_schema', 'performance_schema', 'sys'])))
        .execute(),
      mssql: db => db
        .selectFrom('information_schema.TABLES')
        .select([
          'TABLE_SCHEMA as schema',
          'TABLE_NAME as table',
        ])
        .where('TABLE_TYPE', '=', 'BASE TABLE')
        .execute(),
      clickhouse: db => db
        .selectFrom('information_schema.tables')
        .select([
          'table_schema as schema',
          'table_name as table',
        ])
        .where('table_type', '=', 'BASE TABLE')
        .where('table_schema', '=', connectionResource.name || connectionSystemNames.clickhouse)
        .execute(),
    },
  })

  return queryOptions({
    queryKey: ['connection-resource', connectionResource.id, 'tables-and-schemas', showSystem],
    queryFn: async () => {
      const results = await query.run(connectionResourceToQueryParams(connectionResource))
      const schemas = Object.entries(Object.groupBy(results, table => table.schema)).map(([schema, tables]) => ({
        name: schema,
        tables: tables!.map(table => table.table),
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
})
