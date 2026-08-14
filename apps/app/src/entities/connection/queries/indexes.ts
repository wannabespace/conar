import { queryOptions } from '@tanstack/react-query'
import { type } from 'arktype'
import { sql } from 'kysely'

import type { ConnectionResource } from '../core/sync'
import { connectionResourceToQueryParams, createQuery } from '../runtime/query'

export const indexesType = type({
  column: 'string | null',
  'custom_expression?': 'string',
  'index_type?': 'string',
  is_primary: 'boolean | 1 | 0',
  is_unique: 'boolean | 1 | 0',
  name: 'string',
  schema: 'string',
  table: 'string',
}).pipe(
  ({ is_unique, is_primary, index_type, custom_expression, ...data }) => ({
    ...data,
    customExpression: custom_expression,
    isPrimary: !!is_primary,
    isUnique: !!is_unique,
    type: index_type,
  })
)

export const resourceIndexesQuery = createQuery({
  query: {
    clickhouse: async (db) => {
      const query = await db
        .selectFrom('system.columns')
        .select(['database as schema', 'table', 'name as column'])
        .where('is_in_primary_key', '=', 1)
        .where('database', 'not in', ['system', 'information_schema'])
        .execute()

      return query.map((row) =>
        Object.assign(row, {
          is_primary: true,
          is_unique: true,
          name: 'primary_key',
        })
      )
    },

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
        ])
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
        ])
        .where('TABLE_SCHEMA', 'not in', [
          'mysql',
          'information_schema',
          'performance_schema',
          'sys',
        ])
        .execute(),

    postgres: async (db) => {
      const query = await db
        .selectFrom('pg_catalog.pg_class as t')
        .innerJoin('pg_catalog.pg_index as ix', 't.oid', 'ix.indrelid')
        .innerJoin('pg_catalog.pg_class as i', 'i.oid', 'ix.indexrelid')
        .innerJoin('pg_catalog.pg_am as am', 'i.relam', 'am.oid')
        .leftJoin('pg_catalog.pg_attribute as a', (join) =>
          join
            .onRef('a.attrelid', '=', 't.oid')
            .on(sql<boolean>`a.attnum = ANY(ix.indkey)`)
        )
        .innerJoin('pg_catalog.pg_namespace as n', 'n.oid', 't.relnamespace')
        .select([
          'n.nspname as schema',
          't.relname as table',
          'i.relname as name',
          'a.attname as column',
          'ix.indisunique as is_unique',
          'ix.indisprimary as is_primary',
          'am.amname as index_type',
          sql<string>`pg_get_indexdef(ix.indexrelid)`.as('index_definition'),
        ])
        .where('n.nspname', 'not in', ['pg_catalog', 'information_schema'])
        .where('t.relkind', '=', 'r')
        .execute()

      return query.map(({ index_definition, ...row }) => {
        // To handle custom indexes like JSONB indexes, vector indexes, etc.
        const definitionParts = index_definition
          .toLowerCase()
          .split(` using ${row.index_type.toLowerCase()}`)
        let customExpression = row.column
          ? undefined
          : definitionParts[1]?.trim()

        if (customExpression?.startsWith('((')) {
          customExpression = customExpression.slice(1, -1)
        }
        if (customExpression?.startsWith('((')) {
          customExpression = customExpression.slice(1, -1)
        }

        return Object.assign(row, { custom_expression: customExpression })
      })
    },
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
    queryKey: ['connection-resource', connectionResource.id, 'indexes'],
  })
