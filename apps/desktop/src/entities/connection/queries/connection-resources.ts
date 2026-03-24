import type { connections } from '~/drizzle/schema'
import { queryOptions } from '@tanstack/react-query'
import { type } from 'arktype'
import { createQuery } from '../query'

export const connectionResourcesQuery = createQuery({
  type: type('string[]'),
  silent: true,
  query: {
    postgres: db => db
      .selectFrom('pg_catalog.pg_database')
      .select('datname')
      .where('datistemplate', '=', false)
      .orderBy('datname')
      .execute()
      .then(rows => rows.map(r => r.datname)),

    mysql: db => db
      .selectFrom('information_schema.SCHEMATA')
      .select('SCHEMA_NAME')
      .where('SCHEMA_NAME', 'not in', ['information_schema', 'mysql', 'performance_schema', 'sys'])
      .orderBy('SCHEMA_NAME')
      .execute()
      .then(rows => rows.map(r => r.SCHEMA_NAME)),

    mssql: db => db
      .selectFrom('sys.databases')
      .select('name')
      .where('name', 'not in', ['master', 'model', 'msdb', 'tempdb'])
      .orderBy('name')
      .execute()
      .then(rows => rows.map(r => r.name)),

    clickhouse: db => db
      .selectFrom('system.databases')
      .select('name')
      .where('name', 'not in', ['INFORMATION_SCHEMA', 'information_schema', 'system'])
      .orderBy('name')
      .execute()
      .then(rows => rows.map(r => r.name)),
  },
})

export function connectionResourcesQueryOptions(connection: typeof connections.$inferSelect) {
  return queryOptions({
    queryKey: ['connection', connection.id, 'resources'],
    queryFn: () => connectionResourcesQuery.run({
      connectionString: connection.connectionString,
      type: connection.type,
    }),
    throwOnError: false,
  })
}
