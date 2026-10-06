import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import type { Expression, ExpressionBuilder, Kysely, SqlBool } from 'kysely'
import { sql } from 'kysely'

// oxlint-disable-next-line ts/no-explicit-any
type Eb = ExpressionBuilder<any, any>

export const textContains: Record<
  ConnectionType,
  (eb: Eb, column: string, pattern: string) => Expression<SqlBool>
> = {
  clickhouse: (eb, column, pattern) =>
    eb(eb.fn('toString', [eb.ref(column)]), 'ilike', pattern),
  // Default collations compare case-insensitively, so LIKE already ignores case.
  mssql: (eb, column, pattern) =>
    eb(eb.cast(eb.ref(column), sql`nvarchar(max)`), 'like', pattern),
  mysql: (eb, column, pattern) =>
    eb(eb.cast(eb.ref(column), 'char'), 'like', pattern),
  postgres: (eb, column, pattern) =>
    eb(eb.cast(eb.ref(column), 'text'), 'ilike', pattern),
}

export const insertRows = (
  // oxlint-disable-next-line ts/no-explicit-any
  db: Kysely<any>,
  { schema, table }: { schema: string; table: string },
  rows: Record<string, unknown>[]
) =>
  db
    .withSchema(schema)
    .$extendTables<Record<string, Record<string, unknown>>>()
    .insertInto(table)
    .values(rows)
    .execute()
