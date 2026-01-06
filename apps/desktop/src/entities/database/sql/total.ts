import type { ActiveFilter, Filter } from '@conar/shared/filters'
import { type } from 'arktype'
import { sql } from 'kysely'
import { createQuery } from '../query'
import { buildWhere } from './rows'

interface TotalQueryParams {
  schema: string
  table: string
  filters?: ActiveFilter<Filter>[]
  enforceExactCount?: boolean
}
const TotalResultType = type({
  count: 'string',
  isEstimated: 'boolean',
})
export const totalQuery = createQuery({
  type: TotalResultType,
  query: ({ schema, table, filters = [], enforceExactCount = false }: TotalQueryParams) => ({
    postgres: async (db) => {
      const hasFilters = filters.length > 0
      if (!enforceExactCount && !hasFilters) {
        const estimate = await db
          .withSchema('pg_catalog')
          .selectFrom(sql.table('pg_class').as('c'))
          .innerJoin(
            sql.table('pg_namespace').as('n'),
            join => join.on(sql.ref('n.oid'), '=', sql.ref('c.relnamespace')),
          )
          .select(sql<number>`reltuples`.as('count'))
          .where(sql.ref('n.nspname'), '=', schema)
          .where(sql.ref('c.relname'), '=', table)
          .executeTakeFirst()
        if (estimate && estimate.count != null) {
          return { count: String(estimate.count), isEstimated: true }
        }
      }
      const result = await db
        .withSchema(schema)
        .withTables<{ [table]: Record<string, unknown> }>()
        .selectFrom(table)
        .select(db.fn.countAll().as('count'))
        .$if(hasFilters, qb => qb.where(eb => buildWhere(eb, filters)))
        .executeTakeFirst()
      return { count: String(result?.count ?? 0), isEstimated: false }
    },
    mysql: async (db) => {
      const hasFilters = filters.length > 0
      if (!enforceExactCount && !hasFilters) {
        const estimate = await db
          .withSchema('information_schema')
          .selectFrom('information_schema.TABLES')
          .select('TABLE_ROWS as count')
          .where('TABLE_SCHEMA', '=', schema)
          .where('TABLE_NAME', '=', table)
          .executeTakeFirst()
        if (estimate && estimate.count != null) {
          return { count: String(estimate.count), isEstimated: true }
        }
      }
      const result = await db
        .withSchema(schema)
        .withTables<{ [table]: Record<string, unknown> }>()
        .selectFrom(table)
        .select(db.fn.countAll().as('count'))
        .$if(hasFilters, qb => qb.where(eb => buildWhere(eb, filters)))
        .executeTakeFirst()
      return { count: String(result?.count ?? 0), isEstimated: false }
    },
    mssql: async (db) => {
      const hasFilters = filters.length > 0
      if (!enforceExactCount && !hasFilters) {
        const estimate = await db
          .selectFrom(sql.table('sys.tables').as('t'))
          .innerJoin(
            sql.table('sys.partitions').as('p'),
            join => join.on(sql.ref('t.object_id'), '=', sql.ref('p.object_id')),
          )
          .innerJoin(
            sql.table('sys.schemas').as('s'),
            join => join.on(sql.ref('t.schema_id'), '=', sql.ref('s.schema_id')),
          )
          .select(sql<number>`SUM(CAST(p.rows AS BIGINT))`.as('count'))
          .where(sql.ref('s.name'), '=', schema)
          .where(sql.ref('t.name'), '=', table)
          .where(sql.ref('p.index_id'), 'in', [0, 1])
          .executeTakeFirst()
        if (estimate && estimate.count != null) {
          return { count: String(estimate.count), isEstimated: true }
        }
      }
      const result = await db
        .withSchema(schema)
        .withTables<{ [table]: Record<string, unknown> }>()
        .selectFrom(table)
        .select(db.fn.countAll().as('count'))
        .$if(hasFilters, qb => qb.where(eb => buildWhere(eb, filters)))
        .executeTakeFirst()
      return { count: String(result?.count ?? 0), isEstimated: false }
    },
    clickhouse: async (db) => {
      const hasFilters = filters.length > 0
      if (!enforceExactCount && !hasFilters) {
        const estimate = await db
          .withSchema('system')
          .selectFrom(sql.table('parts').as('p'))
          .select(sql<number>`SUM(rows)`.as('count'))
          .where(sql.ref('database'), '=', schema)
          .where(sql.ref('table'), '=', table)
          .where(sql.ref('active'), '=', 1)
          .executeTakeFirst()
        if (estimate && estimate.count != null) {
          return { count: String(estimate.count), isEstimated: true }
        }
      }
      const result = await db
        .withSchema(schema)
        .withTables<{ [table]: Record<string, unknown> }>()
        .selectFrom(table)
        .select(db.fn.countAll().as('count'))
        .$if(hasFilters, qb => qb.where(eb => buildWhere(eb, filters)))
        .executeTakeFirst()
      return { count: String(result?.count ?? 0), isEstimated: false }
    },
  }),
})
