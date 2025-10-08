import type { ActiveFilter } from '@conar/shared/filters'
import type { databases } from '~/drizzle'
import { sql } from 'drizzle-orm'
import { runSql } from '../query'
import { buildWhere } from './rows'

export function setSql(database: typeof databases.$inferSelect, params: { schema: string, table: string, values: Record<string, unknown>, filters: ActiveFilter[] }) {
  return runSql({
    database,
    label: 'Set',
    query: ({ db }) => db.execute(
      sql.join(
        [
          sql`UPDATE ${sql.identifier(params.schema)}.${sql.identifier(params.table)}`,
          sql`SET ${sql.join(
            Object.entries(params.values)
              .map(([key, value]) => sql`${sql.identifier(key)} = ${sql.param(value)}`),
            sql.raw(', '),
          )}`,
          sql`WHERE ${buildWhere(params.filters)}`,
          sql`RETURNING ${sql.join(Object.keys(params.values).map(key => sql.identifier(key)), sql.raw(', '))}`,
        ],
        sql.raw(' '),
      ),
    ),
  })
}
