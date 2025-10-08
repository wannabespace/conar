import type { databases } from '~/drizzle'
import { columns } from '@conar/shared/schemas/postgres/information'
import { type } from 'arktype'
import { and, eq, sql } from 'drizzle-orm'
import { runSql } from '../query'

export const columnType = type({
  schema: 'string',
  table: 'string',
  id: 'string',
  default: 'string | null',
  type: 'string',
  isEditable: 'boolean',
  isNullable: 'boolean',
})

export function columnsSql(database: typeof databases.$inferSelect, params: { schema: string, table: string }) {
  return runSql({
    type: columnType,
    database,
    label: `Columns for ${params.schema}.${params.table}`,
    query: ({ db }) => db
      .select({
        schema: columns.table_schema,
        table: columns.table_name,
        id: columns.column_name,
        default: columns.column_default,
        type: sql<string>`${sql.join([
          sql`CASE`,
          sql`WHEN ${columns.data_type} = 'ARRAY' THEN REPLACE(${columns.udt_name}, '_', '') || '[]'`,
          sql`WHEN ${columns.data_type} = 'USER-DEFINED' THEN ${columns.udt_name}`,
          sql`WHEN ${columns.data_type} = 'character varying' THEN 'varchar'`,
          sql`WHEN ${columns.data_type} = 'character' THEN 'char'`,
          sql`WHEN ${columns.data_type} = 'bit varying' THEN 'varbit'`,
          sql`WHEN ${columns.data_type} LIKE 'time%' THEN ${columns.udt_name}`,
          sql`ELSE COALESCE(${columns.data_type}, ${columns.udt_name})`,
          sql`END`,
        ], sql.raw(' '))}`,
        isNullable: sql<boolean>`${sql.join([
          sql`CASE`,
          sql`WHEN ${columns.is_nullable} = 'YES' THEN true`,
          sql`ELSE false`,
          sql`END`,
        ], sql.raw(' '))}`,
        isEditable: sql<boolean>`${sql.join([
          sql`CASE`,
          sql`WHEN ${columns.is_updatable} = 'YES' THEN true`,
          sql`ELSE false`,
          sql`END`,
        ], sql.raw(' '))}`,
      })
      .from(columns)
      .where(and(eq(columns.table_schema, params.schema), eq(columns.table_name, params.table))),
  })
}
