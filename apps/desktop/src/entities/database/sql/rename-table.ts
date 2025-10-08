import type { databases } from '~/drizzle'
import { sql } from 'drizzle-orm'
import { runSql } from '../query'

export function renameTableSql(database: typeof databases.$inferSelect, params: { schema: string, oldTable: string, newTable: string }) {
  return runSql({
    database,
    label: 'Rename Table',
    query: ({ db }) => db.execute(
      sql.join([
        sql`ALTER TABLE ${sql.identifier(params.schema)}.${sql.identifier(params.oldTable)}`,
        sql`RENAME TO ${sql.identifier(params.newTable)}`,
      ], sql.raw(' ')),
    ),
  })
}
