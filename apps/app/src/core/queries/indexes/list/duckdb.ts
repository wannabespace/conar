import type { Kysely } from 'kysely'
import { sql } from 'kysely'

import type { Database as DuckdbDatabase } from '~/core/runtime/dialects/duckdb/schema'

const key = sql<string>`(i.expressions::VARCHAR[])[k.range + 1]`

/**
 * `expressions` is the key list as written (`[b, '"Odd Name"']`, an expression as a quoted string), so a key is a
 * column only when its name matches one, which DuckDB compares without case. Constraint-backed indexes are not listed.
 */
export const duckdbIndexes = (db: Kysely<DuckdbDatabase>) =>
  db
    .selectFrom('duckdb_indexes as i')
    .crossJoin(
      sql<{ range: number }>`range(len(i.expressions::VARCHAR[]))`.as('k')
    )
    .leftJoin('duckdb_columns as c', (join) =>
      join
        .onRef('c.database_name', '=', 'i.database_name')
        .onRef('c.schema_name', '=', 'i.schema_name')
        .onRef('c.table_name', '=', 'i.table_name')
        .on(
          sql<boolean>`lower(c.column_name) = lower(CASE WHEN ${key} LIKE '"%"' THEN replace(${key}[2:-2], '""', '"') ELSE ${key} END)`
        )
    )
    .select([
      'i.schema_name as schema',
      'i.table_name as table',
      'i.index_name as name',
      'c.column_name as column',
      sql<string | null>`CASE WHEN c.column_name IS NULL THEN ${key} END`.as(
        'custom_expression'
      ),
      'i.is_unique',
      'i.is_primary',
      'i.sql as index_definition',
      sql<boolean>`bool_or(c.column_name IS NULL) OVER (PARTITION BY i.schema_name, i.index_name)`.as(
        'is_custom'
      ),
    ])
    .where('i.database_name', '=', sql<string>`current_database()`)
    .orderBy('i.schema_name')
    .orderBy('i.index_name')
    .orderBy(sql`k.range`)
    .execute()
