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

function toSafeNumber(value: unknown): number {
  const n = typeof value === 'string' ? Number(value) : value

  if (typeof n !== 'number' || Number.isNaN(n)) {
    return 0
  }

  return Number.isSafeInteger(n) ? n : Number.MAX_SAFE_INTEGER
}

export const totalQuery = createQuery<TotalQueryParams>({
  type: type({
    count: 'number',
    isEstimated: 'boolean',
  }),

  query: ({ schema, table, filters = [], enforceExactCount = false }) => ({
    postgres: async (db) => {
      const shouldEstimate = !enforceExactCount && filters.length === 0

      if (shouldEstimate) {
        const estimate = await db
          .withSchema('pg_catalog')
          .withTables<{
          pg_class: { reltuples: unknown, relname: string, relnamespace: number }
          pg_namespace: { oid: number, nspname: string }
        }>()
          .selectFrom('pg_class as c')
          .innerJoin('pg_namespace as n', 'n.oid', 'c.relnamespace')
          .select(sql<string | number>`c.reltuples::bigint`.as('count'))
          .where('n.nspname', '=', schema)
          .where('c.relname', '=', table)
          .executeTakeFirst()

        if (estimate?.count != null) {
          return { count: toSafeNumber(estimate.count), isEstimated: true }
        }
      }

      const result = await db
        .withSchema(schema)
        .withTables<{ [key: string]: Record<string, unknown> }>()
        .selectFrom(table)
        .select(db.fn.countAll<number>().as('count'))
        .$if(filters.length > 0, qb =>
          qb.where(eb => buildWhere(eb, filters)))
        .executeTakeFirst()

      if (!result?.count) {
        throw new Error(`Exact count failed for ${schema}.${table}`)
      }

      return { count: Number(result.count), isEstimated: false }
    },

    mysql: async (db) => {
      const shouldEstimate = !enforceExactCount && filters.length === 0

      if (shouldEstimate) {
        const estimate = await db
          .withSchema('information_schema')
          .withTables<{
          tables: {
            table_rows: unknown
            table_schema: string
            table_name: string

          }
        }>()
          .selectFrom('tables')
          .select('table_rows as count')
          .where('table_schema', '=', schema)
          .where('table_name', '=', table)
          .executeTakeFirst()

        if (estimate?.count != null) {
          return { count: toSafeNumber(estimate.count), isEstimated: true }
        }
      }

      const result = await db
        .withSchema(schema)
        .withTables<{ [key: string]: Record<string, unknown> }>()
        .selectFrom(table)
        .select(db.fn.countAll<number>().as('count'))
        .$if(filters.length > 0, qb =>
          qb.where(eb => buildWhere(eb, filters)))
        .executeTakeFirst()

      if (!result?.count) {
        throw new Error(`Exact count failed for ${schema}.${table}`)
      }

      return { count: Number(result.count), isEstimated: false }
    },

    mssql: async (db) => {
      const shouldEstimate = !enforceExactCount && filters.length === 0

      if (shouldEstimate) {
        const estimate = await db
          .withTables<{
          'sys.tables': { object_id: number, name: string, schema_id: number }
          'sys.partitions': { object_id: number, index_id: number, rows: number }
          'sys.schemas': { schema_id: number, name: string }
        }>()
          .selectFrom('sys.tables as t')
          .innerJoin('sys.partitions as p', 't.object_id', 'p.object_id')
          .innerJoin('sys.schemas as s', 't.schema_id', 's.schema_id')
          .select(sql<string | number>`SUM(CAST(p.rows AS BIGINT))`.as('count'))
          .where('s.name', '=', schema)
          .where('t.name', '=', table)
          .where('p.index_id', 'in', [0, 1])
          .executeTakeFirst()

        if (estimate?.count != null) {
          return { count: toSafeNumber(estimate.count), isEstimated: true }
        }
      }

      const result = await db
        .withSchema(schema)
        .withTables<{ [key: string]: Record<string, unknown> }>()
        .selectFrom(table)
        .select(db.fn.countAll<number>().as('count'))
        .$if(filters.length > 0, qb =>
          qb.where(eb => buildWhere(eb, filters)))
        .executeTakeFirst()

      if (!result?.count) {
        throw new Error(`Exact count failed for ${schema}.${table}`)
      }

      return { count: Number(result.count), isEstimated: false }
    },

    clickhouse: async (db) => {
      const shouldEstimate = !enforceExactCount && filters.length === 0

      if (shouldEstimate) {
        const estimate = await db
          .withTables<{ parts: { rows: number, active: number, database: string, table: string } }>()
          .selectFrom('parts')
          .select(sql<string | number>`SUM(rows)`.as('count'))
          .where(sql.ref('database'), '=', schema)
          .where(sql.ref('table'), '=', table)
          .where(sql.ref('active'), '=', 1)
          .executeTakeFirst()

        if (estimate?.count != null) {
          return { count: toSafeNumber(estimate.count), isEstimated: true }
        }
      }

      const result = await db
        .withSchema(schema)
        .withTables<{ [table]: Record<string, unknown> }>()
        .selectFrom(table)
        .select(db.fn.countAll().as('count'))
        .$if(filters.length > 0, qb =>
          qb.where(eb => buildWhere(eb, filters)))
        .executeTakeFirst()

      if (!result || result.count == null) {
        throw new Error(`Exact count failed for ${schema}.${table}`)
      }

      return { count: Number(result.count), isEstimated: false }
    },
  }),
})
