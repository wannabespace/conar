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

export const totalQuery = createQuery<TotalQueryParams>({
  type: type({
    count: 'number',
    isEstimated: 'boolean',
  }),

  query: ({ schema, table, filters = [], enforceExactCount = false }) => ({
    postgres: async (db) => {
      const hasFilters = filters.length > 0

      if (!enforceExactCount && !hasFilters) {
        let estimatedRows = 0
        try {
          const estimate = await sql<{ row_estimate: number }>`
            SELECT reltuples::bigint AS row_estimate
            FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = ${schema}
              AND c.relname = ${table}
          `.execute(db)

          // Clamp negative or invalid estimates to 0
          estimatedRows = Math.max(0, Number(estimate.rows[0]?.row_estimate ?? 0))
        }
        catch {
          estimatedRows = 0
        }

        return {
          count: estimatedRows,
          isEstimated: true,
        }
      }

      // Only do exact count if forced or has filters
      const result = await db
        .selectFrom(sql`${sql.ref(schema)}.${sql.ref(table)}`.as('t'))
        .select(db.fn.countAll().as('total'))
        .$if(hasFilters, qb => qb.where(eb => buildWhere(eb, filters)))
        .execute()

      return {
        count: Number(result[0]?.total ?? 0),
        isEstimated: false,
      }
    },

    mysql: async (db) => {
      const hasFilters = filters.length > 0

      if (!enforceExactCount && !hasFilters) {
        const estimate = await sql<{ table_rows: number }>`
          SELECT table_rows
          FROM information_schema.tables
          WHERE table_schema = ${schema}
            AND table_name = ${table}
        `.execute(db)

        const estimatedRows = Number(estimate.rows[0]?.table_rows ?? 0)
        return { count: estimatedRows, isEstimated: true }
      }

      const result = await db
        .selectFrom(sql`${sql.ref(schema)}.${sql.ref(table)}`.as('t'))
        .select(db.fn.countAll().as('total'))
        .$if(hasFilters, qb => qb.where(eb => buildWhere(eb, filters)))
        .execute()

      return { count: Number(result[0]?.total ?? 0), isEstimated: false }
    },

    mssql: async (db) => {
      const hasFilters = filters.length > 0

      if (!enforceExactCount && !hasFilters) {
        const estimate = await sql<{ estimated_rows: number }>`
          SELECT SUM(p.rows) AS estimated_rows
          FROM sys.tables t
          JOIN sys.partitions p ON t.object_id = p.object_id
          JOIN sys.schemas s ON t.schema_id = s.schema_id
          WHERE s.name = ${schema}
            AND t.name = ${table}
            AND p.index_id IN (0,1)
        `.execute(db)

        const estimatedRows = Number(estimate.rows[0]?.estimated_rows ?? 0)
        return { count: estimatedRows, isEstimated: true }
      }

      const result = await db
        .selectFrom(sql`${sql.ref(schema)}.${sql.ref(table)}`.as('t'))
        .select(db.fn.countAll().as('total'))
        .$if(hasFilters, qb => qb.where(eb => buildWhere(eb, filters)))
        .execute()

      return { count: Number(result[0]?.total ?? 0), isEstimated: false }
    },

    clickhouse: async (db) => {
      const hasFilters = filters.length > 0

      if (!enforceExactCount && !hasFilters) {
        const estimate = await sql<{ table_rows: number }>`
          SELECT SUM(rows) AS table_rows
          FROM system.parts
          WHERE database = ${schema}
            AND table = ${table}
            AND active = 1
        `.execute(db)

        const estimatedRows = Number(estimate.rows[0]?.table_rows ?? 0)
        return { count: estimatedRows, isEstimated: true }
      }

      const result = await db
        .selectFrom(sql`${sql.ref(schema)}.${sql.ref(table)}`.as('t'))
        .select(db.fn.countAll().as('total'))
        .$if(hasFilters, qb => qb.where(eb => buildWhere(eb, filters)))
        .execute()

      return { count: Number(result[0]?.total ?? 0), isEstimated: false }
    },
  }),
})
