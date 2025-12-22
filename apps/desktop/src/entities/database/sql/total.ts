/* eslint-disable ts/no-explicit-any */
import type { ActiveFilter, Filter } from '@conar/shared/filters'
import { type } from 'arktype'
import { sql } from 'kysely'
import { createQuery } from '../query'
import { buildWhere } from './rows'

const DEFAULT_THRESHOLD = 50_000

export const totalQuery = createQuery({
  type: type({
    count: 'number',
    isEstimated: 'boolean',
  }),

  query: ({
    schema,
    table,
    filters,
    enforceExactCount = false,
  }: {
    schema: string
    table: string
    filters?: ActiveFilter<Filter>[]
    enforceExactCount?: boolean
  }) => ({

    postgres: async (db) => {
      const estimate = await sql<{ row_estimate: number }>`
        SELECT reltuples::bigint AS row_estimate
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = ${schema}
        AND c.relname = ${table}
      `.execute(db)

      const estimatedRows = Number(estimate.rows[0]?.row_estimate ?? 0)
      const hasFilters = !!filters?.length

      const shouldUseEstimate = !enforceExactCount && estimatedRows > DEFAULT_THRESHOLD && !hasFilters

      if (shouldUseEstimate) {
        return { count: estimatedRows, isEstimated: true }
      }

      const query = await db
        .withSchema(schema)
        .selectFrom(table as any)
        .select(db.fn.countAll().as('total'))
        .$if(!!filters?.length, qb => qb.where((eb: any) => buildWhere(eb, filters!)),
        )
        .execute()

      return {
        count: Number(query[0]?.total ?? 0),
        isEstimated: false,
      }
    },

    mysql: async (db) => {
      const estimate = await sql<{ table_rows: number }>`
        SELECT table_rows
        FROM information_schema.tables
        WHERE table_schema = ${schema}
        AND table_name = ${table}
      `.execute(db)

      const estimatedRows = Number(estimate.rows[0]?.table_rows ?? 0)
      const hasFilters = !!filters?.length

      if (!enforceExactCount && estimatedRows > DEFAULT_THRESHOLD && !hasFilters) {
        return { count: estimatedRows, isEstimated: true }
      }

      const query = await db
        .withSchema(schema)
        .selectFrom(table as any)
        .select(db.fn.countAll().as('total'))
        .$if(!!filters?.length, qb => qb.where((eb: any) => buildWhere(eb, filters!)),
        )
        .execute()

      return { count: Number(query[0]?.total ?? 0), isEstimated: false }
    },

    mssql: async (db) => {
      const estimate = await sql<{ estimated_rows: number }>`
        SELECT SUM(p.rows) AS estimated_rows
        FROM sys.tables t
        INNER JOIN sys.partitions p
          ON t.object_id = p.object_id
        INNER JOIN sys.schemas s
          ON t.schema_id = s.schema_id
        WHERE s.name = ${schema}
        AND p.index_id IN (0, 1)
        AND t.name = ${table}
      `.execute(db)

      const estimatedRows = Number(estimate.rows[0]?.estimated_rows ?? 0)
      const hasFilters = !!filters?.length

      if (!enforceExactCount && estimatedRows > DEFAULT_THRESHOLD && !hasFilters) {
        return { count: estimatedRows, isEstimated: true }
      }

      const query = await db
        .withSchema(schema)
        .selectFrom(table as any)
        .select(db.fn.countAll().as('total'))
        .$if(!!filters?.length, qb => qb.where((eb: any) => buildWhere(eb, filters!)),
        )
        .execute()

      return { count: Number(query[0]?.total ?? 0), isEstimated: false }
    },

    clickhouse: async (db) => {
      const estimate = await sql<{ table_rows: number }>`
        SELECT SUM(rows) AS table_rows
        FROM system.parts
        WHERE database = ${schema}
        AND table = ${table}
        AND active = 1
      `.execute(db)

      const estimatedRows = Number(estimate.rows[0]?.table_rows ?? 0)
      const hasFilters = !!filters?.length

      if (!enforceExactCount && !hasFilters) {
        return { count: estimatedRows, isEstimated: true }
      }

      const query = await db
        .withSchema(schema)
        .selectFrom(table as any)
        .select(db.fn.countAll().as('total'))
        .$if(!!filters?.length, qb => qb.where((eb: any) => buildWhere(eb, filters!)),
        )
        .execute()

      return { count: Number(query[0]?.total ?? 0), isEstimated: false }
    },
  }),
})
