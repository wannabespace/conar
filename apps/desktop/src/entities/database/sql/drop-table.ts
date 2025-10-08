import type { databases } from '~/drizzle'
import { sql } from 'drizzle-orm'
import { runSql } from '../query'

export function dropTableSql(database: typeof databases.$inferSelect, params: { table: string, schema: string, cascade: boolean }) {
  return runSql({
    database,
    label: 'Drop Table',
    query: ({ db }) => db.execute(
      sql.join(
        [
          sql`DROP TABLE ${sql.identifier(params.schema)}.${sql.identifier(params.table)}`,
          params.cascade ? sql`CASCADE` : undefined,
        ],
        sql.raw(' '),
      ),
    ),
  })
}
