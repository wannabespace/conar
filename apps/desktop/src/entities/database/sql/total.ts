import type { ActiveFilter } from '@conar/shared/filters'
import { type } from 'arktype'
import { sql } from 'kysely'
import { createQuery } from '../query'
import { buildWhere } from './rows'

export const totalQuery = createQuery({
  type: type('string | number | bigint | undefined').pipe(v => v !== undefined ? Number(v) : undefined),
  query: ({
    schema,
    table,
    filters,
    enforceExactCount = false,
  }: { schema: string, table: string, filters?: ActiveFilter[], enforceExactCount?: boolean }) => ({
    postgres: async (db) => {
      const THRESHOLD = 100_000
      const estimate = await sql<{ reltuples: number }>`
        SELECT reltuples
        FROM pg_class
        WHERE oid = ${sql.lit(`${schema}.${table}`)}::regclass
      `.execute(db)

      const estimatedRows = Number(estimate.rows[0]?.reltuples ?? 0)
      const hasFilters = filters && filters.length > 0
      const shouldUseEstimate = !enforceExactCount && estimatedRows > THRESHOLD && !hasFilters

      if (shouldUseEstimate) {
        return estimatedRows
      }

      const query = await db
        .withSchema(schema)
        .withTables<{ [table]: Record<string, unknown> }>()
        .selectFrom(table)
        .select(db.fn.countAll().as('total'))
        .$if(filters !== undefined, qb => qb.where(eb => buildWhere(eb, filters!)))
        .execute()
      return query[0]?.total
    },
    mysql: async (db) => {
      const query = await db
        .withSchema(schema)
        .withTables<{ [table]: Record<string, unknown> }>()
        .selectFrom(table)
        .select(db.fn.countAll().as('total'))
        .$if(filters !== undefined, qb => qb.where(eb => buildWhere(eb, filters!)))
        .execute()

      return query[0]?.total
    },
    mssql: async (db) => {
      const query = await db
        .withSchema(schema)
        .withTables<{ [table]: Record<string, unknown> }>()
        .selectFrom(table)
        .select(db.fn.countAll().as('total'))
        .$if(filters !== undefined, qb => qb.where(eb => buildWhere(eb, filters!)))
        .execute()

      return query[0]?.total
    },
    clickhouse: async (db) => {
      const query = await db
        .withSchema(schema)
        .withTables<{ [table]: Record<string, unknown> }>()
        .selectFrom(table)
        .select(db.fn.countAll().as('total'))
        .$if(filters !== undefined, qb => qb.where(eb => buildWhere(eb, filters!)))
        .execute()

      return query[0]?.total
    },
  }),
})
