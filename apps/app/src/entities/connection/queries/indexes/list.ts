import { queryOptions } from '@tanstack/react-query'
import { type } from 'arktype'
import { sql } from 'kysely'

import type { ConnectionResource } from '../../core/sync'
import {
  connectionResourceToQueryParams,
  createQuery,
} from '../../runtime/query'

export const indexesType = type({
  column: 'string | null',
  'custom_expression?': 'string | null',
  'index_definition?': 'string',
  'index_type?': 'string',
  'is_constraint?': 'boolean | 1 | 0',
  'is_custom?': 'boolean | 1 | 0',
  is_primary: 'boolean | 1 | 0',
  is_unique: 'boolean | 1 | 0',
  name: 'string',
  schema: 'string',
  table: 'string',
}).pipe(
  ({
    is_unique,
    is_primary,
    is_constraint,
    is_custom,
    index_type,
    index_definition,
    custom_expression,
    ...data
  }) => ({
    ...data,
    constraintOwned: !!is_primary || !!is_constraint,
    custom: !!is_custom,
    customExpression: custom_expression ?? undefined,
    definition: index_definition,
    isPrimary: !!is_primary,
    isUnique: !!is_unique,
    type: index_type,
  })
)

export const structureQueryKey = (connectionResource: ConnectionResource) => [
  'connection-resource',
  connectionResource.id,
  'structure',
]

export const resourceIndexesQuery = createQuery({
  query: {
    clickhouse: (db) =>
      db
        .selectFrom('system.columns')
        .select([
          'database as schema',
          'table',
          'name as column',
          sql.lit('primary_key').as('name'),
          sql.lit(true).as('is_primary'),
          sql.lit(true).as('is_unique'),
        ])
        .where('is_in_primary_key', '=', 1)
        .where('database', 'not in', ['system', 'information_schema'])
        .execute(),

    mssql: (db) =>
      db
        .selectFrom('sys.indexes as i')
        .innerJoin('sys.tables as t', 't.object_id', 'i.object_id')
        .innerJoin('sys.schemas as s', 's.schema_id', 't.schema_id')
        .innerJoin('sys.index_columns as ic', (join) =>
          join
            .onRef('ic.object_id', '=', 'i.object_id')
            .onRef('ic.index_id', '=', 'i.index_id')
        )
        .innerJoin('sys.columns as c', (join) =>
          join
            .onRef('c.object_id', '=', 'ic.object_id')
            .onRef('c.column_id', '=', 'ic.column_id')
        )
        .select([
          's.name as schema',
          't.name as table',
          'i.name as name',
          'c.name as column',
          'i.is_unique as is_unique',
          'i.is_primary_key as is_primary',
          'i.is_unique_constraint as is_constraint',
          sql<boolean>`CASE WHEN i.type_desc <> 'NONCLUSTERED' OR i.has_filter = 1 OR EXISTS (SELECT 1 FROM sys.index_columns x WHERE x.object_id = i.object_id AND x.index_id = i.index_id AND (x.is_included_column = 1 OR x.is_descending_key = 1)) THEN 1 ELSE 0 END`.as(
            'is_custom'
          ),
        ])
        .where('ic.key_ordinal', '>', 0)
        .orderBy('ic.key_ordinal')
        .execute(),

    mysql: (db) =>
      db
        .selectFrom('information_schema.STATISTICS')
        .select([
          'TABLE_SCHEMA as schema',
          'TABLE_NAME as table',
          'INDEX_NAME as name',
          'COLUMN_NAME as column',
          (eb) => eb('NON_UNIQUE', '=', 0).as('is_unique'),
          (eb) => eb('INDEX_NAME', '=', 'PRIMARY').as('is_primary'),
          sql<boolean>`COALESCE(INDEX_TYPE <> 'BTREE' OR SUB_PART IS NOT NULL OR COLLATION = 'D' OR COLUMN_NAME IS NULL, 0)`.as(
            'is_custom'
          ),
        ])
        .where('TABLE_SCHEMA', 'not in', [
          'mysql',
          'information_schema',
          'performance_schema',
          'sys',
        ])
        .orderBy('SEQ_IN_INDEX')
        .execute(),

    postgres: (db) =>
      db
        .selectFrom('pg_catalog.pg_class as t')
        .innerJoin('pg_catalog.pg_index as ix', 't.oid', 'ix.indrelid')
        .innerJoin('pg_catalog.pg_class as i', 'i.oid', 'ix.indexrelid')
        .innerJoin('pg_catalog.pg_am as am', 'i.relam', 'am.oid')
        .innerJoin('pg_catalog.pg_namespace as n', 'n.oid', 't.relnamespace')
        .crossJoinLateral(
          sql<{
            key: number
            ordinality: number
          }>`unnest(ix.indkey::int2[]) WITH ORDINALITY`.as('key')
        )
        .leftJoin('pg_catalog.pg_attribute as a', (join) =>
          join
            .onRef('a.attrelid', '=', 't.oid')
            .onRef('a.attnum', '=', 'key.key')
        )
        .select([
          'n.nspname as schema',
          't.relname as table',
          'i.relname as name',
          'a.attname as column',
          sql<
            string | null
          >`CASE WHEN key.key = 0 THEN pg_get_indexdef(ix.indexrelid, key.ordinality::int, true) END`.as(
            'custom_expression'
          ),
          'ix.indisunique as is_unique',
          'ix.indisprimary as is_primary',
          'am.amname as index_type',
          sql<string>`pg_get_indexdef(ix.indexrelid)`.as('index_definition'),
          sql<boolean>`EXISTS (SELECT 1 FROM pg_catalog.pg_constraint WHERE conindid = ix.indexrelid AND contype IN ('p', 'u', 'x'))`.as(
            'is_constraint'
          ),
          sql<boolean>`am.amname <> 'btree' OR ix.indpred IS NOT NULL OR ix.indnkeyatts <> ix.indnatts OR 0 = ANY(ix.indkey::int2[]) OR EXISTS (SELECT 1 FROM unnest(ix.indoption::int2[]) AS o WHERE o <> 0)`.as(
            'is_custom'
          ),
        ])
        .where('n.nspname', 'not in', ['pg_catalog', 'information_schema'])
        .where('t.relkind', 'in', ['r', 'p', 'm'])
        .orderBy('key.ordinality')
        .execute(),
  },
  type: indexesType.array(),
})

export const resourceIndexesQueryOptions = ({
  connectionResource,
}: {
  connectionResource: ConnectionResource
}) =>
  queryOptions({
    queryFn: async () =>
      resourceIndexesQuery.run(
        await connectionResourceToQueryParams(connectionResource)
      ),
    queryKey: [...structureQueryKey(connectionResource), 'indexes'],
  })
