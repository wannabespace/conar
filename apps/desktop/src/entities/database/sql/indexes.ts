import type { Kysely } from 'kysely'
import type { Columns as ClickHouseColumns } from '../dialects/clickhouse/schema/system'
import { type } from 'arktype'
import { sql } from 'kysely'
import { createQuery } from '../query'

export const indexesType = type({
  schema: 'string',
  table: 'string',
  name: 'string',
  column: 'string',
  is_unique: 'boolean | 1 | 0',
  is_primary: 'boolean | 1 | 0',
}).pipe(data => ({
  ...data,
  isUnique: !!data.is_unique,
  isPrimary: !!data.is_primary,
}))

export const indexesQuery = createQuery({
  type: indexesType.array(),
  query: () => ({
    postgres: db => db
      .selectFrom('pg_catalog.pg_class as t')
      .innerJoin('pg_catalog.pg_index as ix', 't.oid', 'ix.indrelid')
      .innerJoin('pg_catalog.pg_class as i', 'i.oid', 'ix.indexrelid')
      .innerJoin('pg_catalog.pg_attribute as a', join => join
        .onRef('a.attrelid', '=', 't.oid')
        .on(sql<boolean>`a.attnum = ANY(ix.indkey)`))
      .innerJoin('pg_catalog.pg_namespace as n', 'n.oid', 't.relnamespace')
      .select([
        'n.nspname as schema',
        't.relname as table',
        'i.relname as name',
        'a.attname as column',
        'ix.indisunique as is_unique',
        'ix.indisprimary as is_primary',
      ])
      .where('n.nspname', 'not in', ['pg_catalog', 'information_schema'])
      .where('t.relkind', '=', 'r')
      .execute(),

    mysql: db => db
      .selectFrom('information_schema.STATISTICS')
      .select([
        'TABLE_SCHEMA as schema',
        'TABLE_NAME as table',
        'INDEX_NAME as name',
        'COLUMN_NAME as column',
        eb => eb('NON_UNIQUE', '=', 0).as('is_unique'),
        eb => eb('INDEX_NAME', '=', 'PRIMARY').as('is_primary'),
      ])
      .where('TABLE_SCHEMA', 'not in', ['mysql', 'information_schema', 'performance_schema', 'sys'])
      .execute(),

    mssql: db => db
      .selectFrom('sys.indexes as i')
      .innerJoin('sys.tables as t', 't.object_id', 'i.object_id')
      .innerJoin('sys.schemas as s', 's.schema_id', 't.schema_id')
      .innerJoin('sys.index_columns as ic', join => join
        .onRef('ic.object_id', '=', 'i.object_id')
        .onRef('ic.index_id', '=', 'i.index_id'))
      .innerJoin('sys.columns as c', join => join
        .onRef('c.object_id', '=', 'ic.object_id')
        .onRef('c.column_id', '=', 'ic.column_id'))
      .select([
        's.name as schema',
        't.name as table',
        'i.name as name',
        'c.name as column',
        'i.is_unique as is_unique',
        'i.is_primary_key as is_primary',
      ])
      .execute(),

    clickhouse: async (db) => {
      /* ClickHouse uses ORDER BY as its primary key/sorting key (similar to clustered index).
      It doesn't enforce constraints like traditional RDBMS (no foreign keys, unique constraints, etc.).
      We show ORDER BY columns as primary key indexes since that's how ClickHouse optimizes queries. */

      const sysDb = db as unknown as Kysely<{
        'system.columns': ClickHouseColumns
      }>

      const query = await sysDb
        .selectFrom('system.columns')
        .select([
          'database as schema',
          'table',
          'name as column',
        ])
        .where('is_in_primary_key', '=', 1)
        .where('database', 'not in', ['system', 'information_schema'])
        .execute()

      return query.map(row => ({
        ...row,
        name: 'primary_key',
        is_unique: true,
        is_primary: true,
      }))
    },
  }),
})
