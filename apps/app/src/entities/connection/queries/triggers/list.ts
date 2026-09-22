import { unsupported } from '@tamery/shared/unsupported'
import { queryOptions } from '@tanstack/react-query'
import { type } from 'arktype'
import { sql } from 'kysely'

import type { ConnectionResource } from '~/entities/connection/core/sync'

import {
  connectionResourceToQueryParams,
  createQuery,
} from '../../runtime/query'
import { mssqlModuleBody } from '../shared/definition'

export const triggersType = type({
  'body?': 'string | null',
  'custom?': 'boolean | 1 | 0',
  'enabled?': 'boolean | 1 | 0',
  'enabled_mode?': 'string',
  event: 'string',
  'function_name?': 'string | null',
  'function_schema?': 'string | null',
  name: 'string',
  'oid?': 'number',
  'orientation?': 'string',
  schema: 'string',
  table: 'string',
  timing: 'string',
}).pipe(
  ({
    body,
    custom,
    enabled,
    enabled_mode,
    function_name,
    function_schema,
    orientation,
    ...item
  }) => ({
    ...item,
    body: body ?? null,
    custom: !!custom,
    enabled: enabled === undefined ? null : !!enabled,
    enabledMode: enabled_mode || 'O',
    functionName: function_name || null,
    functionSchema: function_schema || null,
    orientation:
      orientation === 'ROW' ? ('ROW' as const) : ('STATEMENT' as const),
  })
)

const resourceTriggersQuery = createQuery({
  query: {
    clickhouse: unsupported('Triggers'),
    mssql: (db) =>
      db
        .selectFrom('sys.triggers as t')
        .innerJoin('sys.objects as o', 't.parent_id', 'o.object_id')
        .innerJoin('sys.schemas as s', 'o.schema_id', 's.schema_id')
        .leftJoin('sys.trigger_events as te', 't.object_id', 'te.object_id')
        .leftJoin('sys.sql_modules as sm', 't.object_id', 'sm.object_id')
        .select([
          's.name as schema',
          'o.name as table',
          't.name as name',
          sql<string>`COALESCE(STRING_AGG(te.type_desc, ' OR '), 'UNKNOWN')`.as(
            'event'
          ),
          sql<string>`IIF(t.is_instead_of_trigger = 1, 'INSTEAD OF', 'AFTER')`.as(
            'timing'
          ),
          mssqlModuleBody(sql`sm.definition`).as('body'),
          sql<1 | 0>`IIF(t.is_disabled = 0, 1, 0)`.as('enabled'),
          // Replication, schema binding and EXECUTE AS live in the header the
          // form rewrites, and the body is what follows it.
          sql<1 | 0>`IIF(
            t.is_not_for_replication = 1
            OR sm.is_schema_bound = 1
            OR sm.execute_as_principal_id IS NOT NULL
          , 1, 0)`.as('custom'),
        ])
        .where('t.is_ms_shipped', '=', false)
        .where('t.parent_class', '=', 1)
        .where('s.name', '!=', 'sys')
        .groupBy([
          's.name',
          'o.name',
          't.name',
          't.is_instead_of_trigger',
          't.is_disabled',
          't.is_not_for_replication',
          'sm.definition',
          'sm.is_schema_bound',
          sql`sm.execute_as_principal_id`,
        ])
        .execute(),
    mysql: (db) =>
      db
        .selectFrom('information_schema.TRIGGERS as t')
        .select([
          't.TRIGGER_SCHEMA as schema',
          't.EVENT_OBJECT_TABLE as table',
          't.TRIGGER_NAME as name',
          't.EVENT_MANIPULATION as event',
          't.ACTION_TIMING as timing',
          't.ACTION_ORIENTATION as orientation',
          't.ACTION_STATEMENT as body',
          // A trigger placed with FOLLOWS/PRECEDES loses its place in a
          // drop-and-create, and the form cannot say where it belongs.
          sql<1 | 0>`t.ACTION_ORDER > 1`.as('custom'),
        ])
        .where('t.TRIGGER_SCHEMA', 'not in', [
          'mysql',
          'information_schema',
          'performance_schema',
          'sys',
        ])
        .execute(),
    postgres: (db) =>
      db
        .selectFrom('pg_catalog.pg_trigger as t')
        .innerJoin('pg_catalog.pg_class as c', 't.tgrelid', 'c.oid')
        .innerJoin('pg_catalog.pg_namespace as n', 'c.relnamespace', 'n.oid')
        .leftJoin('pg_catalog.pg_proc as p', 't.tgfoid', 'p.oid')
        .leftJoin('pg_catalog.pg_namespace as fn', 'p.pronamespace', 'fn.oid')
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
          sql<string>`CASE WHEN (t.tgtype::int & 1) != 0 THEN 'ROW' ELSE 'STATEMENT' END`.as(
            'orientation'
          ),
          'p.proname as function_name',
          'fn.nspname as function_schema',
          't.tgenabled as enabled_mode',
          sql<boolean>`(
            t.tgconstraint <> 0
            OR t.tgnargs > 0
            OR t.tgqual IS NOT NULL
            OR pg_get_triggerdef(t.oid) LIKE '%UPDATE OF %'
            OR pg_get_triggerdef(t.oid) LIKE '%REFERENCING %'
          )`.as('custom'),
          't.oid as oid',
        ])
        .where('t.tgisinternal', '=', false)
        .where('n.nspname', 'not like', 'pg_%')
        .where('n.nspname', '!=', 'information_schema')
        .execute(),
  },
  type: triggersType.array(),
})

export const resourceTriggersQueryOptions = ({
  connectionResource,
}: {
  connectionResource: ConnectionResource
}) =>
  queryOptions({
    queryFn: async () =>
      resourceTriggersQuery.run(
        await connectionResourceToQueryParams(connectionResource)
      ),
    queryKey: ['connection-resource', connectionResource.id, 'triggers'],
  })
