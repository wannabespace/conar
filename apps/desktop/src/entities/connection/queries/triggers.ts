import type { connectionsResources } from '~/drizzle/schema'
import { queryOptions } from '@tanstack/react-query'
import { type } from 'arktype'
import { sql } from 'kysely'
import { connectionResourceToQueryParams, createQuery } from '../query'

export const triggersType = type({
  schema: 'string',
  table: 'string',
  name: 'string',
  event: 'string',
  timing: 'string',
  enabled: 'boolean',
  function_name: 'string | null',
})

export const resourceTriggersQuery = createQuery({
  type: triggersType.array(),
  query: {
    postgres: db => db
      .selectFrom('pg_catalog.pg_trigger as t')
      .innerJoin('pg_catalog.pg_class as c', 't.tgrelid', 'c.oid')
      .innerJoin('pg_catalog.pg_namespace as n', 'c.relnamespace', 'n.oid')
      .leftJoin('pg_catalog.pg_proc as p', 't.tgfoid', 'p.oid')
      .select([
        'n.nspname as schema',
        'c.relname as table',
        't.tgname as name',
        sql<string>`NULLIF(CONCAT_WS(' OR ',
          CASE WHEN (t.tgtype::int & 4) != 0 THEN 'INSERT' END,
          CASE WHEN (t.tgtype::int & 8) != 0 THEN 'DELETE' END,
          CASE WHEN (t.tgtype::int & 16) != 0 THEN 'UPDATE' END,
          CASE WHEN (t.tgtype::int & 32) != 0 THEN 'TRUNCATE' END
        ), '')`.as('event'),
        sql<string>`CASE
          WHEN (t.tgtype::int & 2) != 0 THEN 'BEFORE'
          WHEN (t.tgtype::int & 64) != 0 THEN 'INSTEAD OF'
          ELSE 'AFTER'
        END`.as('timing'),
        sql<boolean>`t.tgenabled != 'D'`.as('enabled'),
        'p.proname as function_name',
      ])
      .where('t.tgisinternal', '=', false)
      .where('n.nspname', 'not like', 'pg_%')
      .where('n.nspname', '!=', 'information_schema')
      .execute(),
    mysql: db => db
      .selectFrom('information_schema.TRIGGERS as t')
      .select([
        't.TRIGGER_SCHEMA as schema',
        't.EVENT_OBJECT_TABLE as table',
        't.TRIGGER_NAME as name',
        't.EVENT_MANIPULATION as event',
        't.ACTION_TIMING as timing',
        sql<boolean>`true`.as('enabled'),
        sql<null>`NULL`.as('function_name'),
      ])
      .where('t.TRIGGER_SCHEMA', 'not in', ['mysql', 'information_schema', 'performance_schema', 'sys'])
      .execute(),
    mssql: db => db
      .selectFrom('sys.triggers as t')
      .innerJoin('sys.objects as o', 't.parent_id', 'o.object_id')
      .innerJoin('sys.schemas as s', 'o.schema_id', 's.schema_id')
      .leftJoin('sys.trigger_events as te', 't.object_id', 'te.object_id')
      .select([
        's.name as schema',
        'o.name as table',
        't.name as name',
        sql<string>`ISNULL(te.type_desc, 'UNKNOWN')`.as('event'),
        sql<string>`CASE WHEN t.is_instead_of_trigger = 1 THEN 'INSTEAD OF' ELSE 'AFTER' END`.as('timing'),
        sql<boolean>`CASE WHEN t.is_disabled = 0 THEN 1 ELSE 0 END`.as('enabled'),
        sql<null>`NULL`.as('function_name'),
      ])
      .where('t.is_ms_shipped', '=', false)
      .where('t.parent_class', '=', 1)
      .where('s.name', '!=', 'sys')
      .execute(),
    clickhouse: async () => {
      return []
    },
  },
})

export function resourceTriggersQueryOptions({ connectionResource }: { connectionResource: typeof connectionsResources.$inferSelect }) {
  return queryOptions({
    queryFn: () => resourceTriggersQuery.run(connectionResourceToQueryParams(connectionResource)),
    queryKey: ['connection-resource', connectionResource.id, 'triggers'],
  })
}
