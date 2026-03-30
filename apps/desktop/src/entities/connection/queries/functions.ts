import type { connectionsResources } from '~/drizzle/schema'
import { queryOptions } from '@tanstack/react-query'
import { type } from 'arktype'
import { sql } from 'kysely'
import { connectionResourceToQueryParams, createQuery } from '../query'

export const functionsType = type({
  schema: 'string',
  name: 'string',
  type: 'string',
  language: 'string',
  return_type: 'string | null',
  argument_count: 'number',
}).pipe(({ type: fnType, ...item }) => ({
  ...item,
  type: fnType as 'function' | 'procedure',
}))

export const resourceFunctionsQuery = createQuery({
  type: functionsType.array(),
  query: {
    postgres: db => db
      .selectFrom('pg_catalog.pg_proc as p')
      .innerJoin('pg_catalog.pg_namespace as n', 'p.pronamespace', 'n.oid')
      .innerJoin('pg_catalog.pg_language as l', 'p.prolang', 'l.oid')
      .leftJoin('pg_catalog.pg_type as t', 'p.prorettype', 't.oid')
      .select([
        'n.nspname as schema',
        'p.proname as name',
        sql<string>`CASE p.prokind
          WHEN 'f' THEN 'function'
          WHEN 'p' THEN 'procedure'
          WHEN 'a' THEN 'function'
          WHEN 'w' THEN 'function'
          ELSE 'function'
        END`.as('type'),
        'l.lanname as language',
        't.typname as return_type',
        sql<number>`p.pronargs`.as('argument_count'),
      ])
      .where('n.nspname', 'not like', 'pg_%')
      .where('n.nspname', '!=', 'information_schema')
      .where('p.prokind', '!=', 'a')
      .execute(),
    mysql: db => db
      .selectFrom('information_schema.ROUTINES as r')
      .select([
        'r.ROUTINE_SCHEMA as schema',
        'r.ROUTINE_NAME as name',
        sql<string>`LOWER(r.ROUTINE_TYPE)`.as('type'),
        sql<string>`'SQL'`.as('language'),
        sql<string | null>`CASE WHEN r.ROUTINE_TYPE = 'FUNCTION' THEN r.DATA_TYPE ELSE NULL END`.as('return_type'),
        sql<number>`0`.as('argument_count'),
      ])
      .where('r.ROUTINE_SCHEMA', 'not in', ['mysql', 'information_schema', 'performance_schema', 'sys'])
      .execute(),
    mssql: db => db
      .selectFrom('sys.objects as o')
      .innerJoin('sys.schemas as s', 'o.schema_id', 's.schema_id')
      .select([
        's.name as schema',
        'o.name as name',
        sql<string>`CASE
          WHEN o.type IN ('FN', 'IF', 'TF', 'FS', 'FT') THEN 'function'
          WHEN o.type IN ('P', 'PC') THEN 'procedure'
          ELSE 'function'
        END`.as('type'),
        sql<string>`CASE
          WHEN o.type IN ('FS', 'FT', 'PC') THEN 'CLR'
          ELSE 'SQL'
        END`.as('language'),
        sql<string | null>`CASE
          WHEN o.type = 'FN' THEN 'scalar'
          WHEN o.type IN ('IF', 'TF') THEN 'table'
          WHEN o.type = 'FS' THEN 'CLR scalar'
          WHEN o.type = 'FT' THEN 'CLR table'
          ELSE NULL
        END`.as('return_type'),
        sql<number>`0`.as('argument_count'),
      ])
      .where('o.type', 'in', ['FN', 'IF', 'TF', 'FS', 'FT', 'P', 'PC'])
      .where('o.is_ms_shipped', '=', false)
      .where('s.name', 'not in', ['sys', 'INFORMATION_SCHEMA'])
      .execute(),
    clickhouse: async () => {
      return []
    },
  },
})

export function resourceFunctionsQueryOptions({ connectionResource }: { connectionResource: typeof connectionsResources.$inferSelect }) {
  return queryOptions({
    queryFn: () => resourceFunctionsQuery.run(connectionResourceToQueryParams(connectionResource)),
    queryKey: ['connection-resource', connectionResource.id, 'functions'],
  })
}
