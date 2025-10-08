import type { databases } from '~/drizzle'
import { tables } from '@conar/shared/schemas/postgres/information'
import { type } from 'arktype'
import { and, eq, like, not, notInArray } from 'drizzle-orm'
import { runSql } from '../query'

export const tablesAndSchemasType = type({
  schema: 'string',
  table: 'string',
})

export function tablesAndSchemasSql(database: typeof databases.$inferSelect) {
  return runSql({
    type: tablesAndSchemasType,
    database,
    label: `Tables and Schemas`,
    query: ({ db }) => db
      .select({
        schema: tables.table_schema,
        table: tables.table_name,
      })
      .from(tables)
      .where(and(
        notInArray(tables.table_schema, ['pg_catalog', 'information_schema']),
        not(like(tables.table_schema, 'pg_toast%')),
        not(like(tables.table_schema, 'pg_temp%')),
        eq(tables.table_type, 'BASE TABLE'),
      )),
  })
}
