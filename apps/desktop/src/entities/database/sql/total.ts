import type { ActiveFilter } from '@conar/shared/filters'
import type { databases } from '~/drizzle'
import { type } from 'arktype'
import { count, sql } from 'drizzle-orm'
import { runSql } from '../query'
import { buildWhere } from './rows'

export const totalType = type({
  total: 'number',
})

export function totalSql(database: typeof databases.$inferSelect, params: { schema: string, table: string, filters?: ActiveFilter[] }) {
  return runSql({
    type: totalType,
    database,
    label: `Total for ${params.schema}.${params.table}`,
    query: ({ db }) => db
      .select({
        total: count(),
      })
      .from(sql`${sql.identifier(params.schema)}.${sql.identifier(params.table)}`)
      .where(params.filters?.length ? buildWhere(params.filters) : undefined),
  })
}
