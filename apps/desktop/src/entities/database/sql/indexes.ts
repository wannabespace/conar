import type { Kysely } from 'kysely'
import type { Columns as ClickHouseColumns } from '../dialects/clickhouse/schema/system'
import type { SysColumns, SysIndexColumns, SysIndexes, SysSchemas, SysTables } from '../dialects/mssql/schema/indexes'
import type { MysqlStatistics } from '../dialects/mysql/schema/indexes'
import type { PgAttribute, PgClass, PgIndex, PgNamespace } from '../dialects/postgres/schema/indexes'
import { type } from 'arktype'
import { sql } from 'kysely'
import { createQuery } from '../query'

export const indexesType = type({
  schema: 'string',
  table: 'string',
  name: 'string',
  column: 'string',
  isUnique: 'boolean | 1 | 0',
  isPrimary: 'boolean | 1 | 0',
}).pipe(data => ({
  ...data,
  isUnique: !!data.isUnique,
  isPrimary: !!data.isPrimary,
}))

export const indexesQuery = createQuery({
  type: indexesType.array(),
  query: () => ({
    postgres: (db) => {
      const sysDb = db as unknown as Kysely<{
        pg_class: PgClass
        pg_index: PgIndex
        pg_attribute: PgAttribute
        pg_namespace: PgNamespace
      }>

      return sysDb
        .selectFrom('pg_class as t')
        .innerJoin('pg_index as ix', 't.oid', 'ix.indrelid')
        .innerJoin('pg_class as i', 'i.oid', 'ix.indexrelid')
        .innerJoin('pg_attribute as a', join => join
          .onRef('a.attrelid', '=', 't.oid')
          .on(sql<boolean>`a.attnum = ANY(ix.indkey)`))
        .innerJoin('pg_namespace as n', 'n.oid', 't.relnamespace')
        .select([
          'n.nspname as schema',
          't.relname as table',
          'i.relname as name',
          'a.attname as column',
          'ix.indisunique as isUnique',
          'ix.indisprimary as isPrimary',
        ])
        .where('n.nspname', 'not in', ['pg_catalog', 'information_schema'])
        .where('t.relkind', '=', 'r')
        .execute()
    },

    mysql: (db) => {
      const sysDb = db as unknown as Kysely<{
        'information_schema.STATISTICS': MysqlStatistics
      }>

      return sysDb
        .selectFrom('information_schema.STATISTICS')
        .select([
          'TABLE_SCHEMA as schema',
          'TABLE_NAME as table',
          'INDEX_NAME as name',
          'COLUMN_NAME as column',
          eb => eb('NON_UNIQUE', '=', 0).as('isUnique'),
          eb => eb('INDEX_NAME', '=', 'PRIMARY').as('isPrimary'),
        ])
        .where('TABLE_SCHEMA', 'not in', ['mysql', 'information_schema', 'performance_schema', 'sys'])
        .execute()
    },

    mssql: (db) => {
      const sysDb = db as unknown as Kysely<{
        'sys.indexes': SysIndexes
        'sys.tables': SysTables
        'sys.schemas': SysSchemas
        'sys.index_columns': SysIndexColumns
        'sys.columns': SysColumns
      }>

      return sysDb
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
          'i.is_unique as isUnique',
          'i.is_primary_key as isPrimary',
        ])
        .execute()
    },

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
        isUnique: true,
        isPrimary: true,
      }))
    },
  }),
})
