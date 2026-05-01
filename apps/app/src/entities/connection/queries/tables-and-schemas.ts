import type { connectionsResources } from '~/drizzle/schema'
import { memoize } from '@conar/memoize'
import { queryOptions } from '@tanstack/react-query'
import { type } from 'arktype'
import { connectionResourceToQueryParams, createQuery } from '../query'

const tableTypes = ['base table', 'view', 'materialized view'] as const

export const tablesAndSchemasType = type({
  schema: 'string',
  table: 'string',
  type: type.or(
    type.enumerated(...tableTypes),
    type.enumerated(...tableTypes.map(t => t.toUpperCase()) as Uppercase<typeof tableTypes[number]>[]),
  ),
}).pipe(({ type, ...props }) => {
  const formattedType = type.toLowerCase() as typeof tableTypes[number]
  return {
    ...props,
    type: formattedType === 'base table' ? 'table' as const : formattedType,
  }
})

export const resourceTablesAndSchemasQuery = memoize(({ connectionResource, showSystem }: { connectionResource: typeof connectionsResources.$inferSelect, showSystem: boolean }) => {
  return createQuery({
    type: tablesAndSchemasType.array(),
    query: {
      postgres: db => db
        .selectFrom('pg_catalog.pg_class as c')
        .innerJoin('pg_catalog.pg_namespace as n', 'n.oid', 'c.relnamespace')
        .select(eb => [
          'n.nspname as schema',
          'c.relname as table',
          eb.case('c.relkind')
            .when('v')
            .then('view' as const)
            .when('m')
            .then('materialized view' as const)
            .else('base table' as const)
            .end()
            .as('type'),
        ])
        .where('c.relkind', 'in', ['r', 'p', 'v', 'm'])
        .where(({ eb, and, not }) => and([
          not(eb('n.nspname', 'like', 'pg_toast%')),
          not(eb('n.nspname', 'like', 'pg_temp%')),
        ]))
        .$if(!showSystem, qb => qb.where('n.nspname', 'not in', ['pg_catalog', 'information_schema']))
        .execute(),
      mysql: db => db
        .selectFrom('information_schema.TABLES')
        .select([
          'TABLE_SCHEMA as schema',
          'TABLE_NAME as table',
          'TABLE_TYPE as type',
        ])
        .where('TABLE_TYPE', 'in', ['BASE TABLE', 'VIEW'])
        .$narrowType<{ type: 'BASE TABLE' | 'VIEW' }>()
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
        .selectFrom('system.tables')
        .select(eb => [
          'database as schema',
          'name as table',
          eb.case()
            .when('engine', '=', 'MaterializedView')
            .then('materialized view' as const)
            .when('engine', 'ilike', '%View%')
            .then('view' as const)
            .else('base table' as const)
            .end()
            .as('type'),
        ])
        .where('database', '=', connectionResource.name)
        .where('is_temporary', '=', 0)
        .execute(),
    },
  })
})

export function resourceTablesAndSchemasQueryOptions({ connectionResource, showSystem }: { connectionResource: typeof connectionsResources.$inferSelect, showSystem: boolean }) {
  return queryOptions({
    queryKey: ['connection-resource', connectionResource.id, 'tables-and-schemas', showSystem],
    queryFn: async () => {
      const results = await resourceTablesAndSchemasQuery({ connectionResource, showSystem }).run(connectionResourceToQueryParams(connectionResource))
      const schemas = Object.entries(Object.groupBy(results, table => table.schema)).map(([schema, tables]) => ({
        name: schema,
        tables: tables!.map(table => ({ name: table.table, type: table.type })),
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
