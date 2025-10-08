import type { databases } from '~/drizzle'
import { eq, or, sql } from 'drizzle-orm'
import { runSql } from '../query'

export function deleteRowsSql(database: typeof databases.$inferSelect, params: { table: string, schema: string, primaryKeys: Record<string, unknown>[] }) {
  const where = or(
    ...params.primaryKeys.flatMap(pk => Object.entries(pk)
      .map(([key, value]) => eq(sql.identifier(key), value))),
  )

  return runSql({
    database,
    label: 'Delete Rows',
    query: ({ db }) => db
      .execute(
        sql.join(
          [
            sql`DELETE FROM ${sql.identifier(params.schema)}.${sql.identifier(params.table)}`,
            sql`WHERE ${where}`,
          ],
          sql.raw(' '),
        ),
      ),
  })
}
