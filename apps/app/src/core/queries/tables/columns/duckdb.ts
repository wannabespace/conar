import { Dialect } from '@tamery/shared/enums/connection-type'
import { dialects, tokenize } from '@tamery/sql'
import type { Kysely } from 'kysely'
import { sql } from 'kysely'

import type { Database as DuckdbDatabase } from '~/core/runtime/dialects/duckdb/schema'

import type { ColumnsFilter } from '../shape'

const GENERATED_DEFINITION = '%GENERATED ALWAYS AS%'

/** DuckDB's catalog has no flag for a generated column: only the table's stored CREATE TABLE says which ones are. */
const generatedColumns = (createTable: string) => {
  const generated = new Set<string>()
  let depth = 0
  let column: string | null = null
  for (const token of tokenize(createTable, dialects[Dialect.DuckDB]).tokens) {
    if (token.text === '(' || token.text === ')') {
      depth += token.text === '(' ? 1 : -1
      column = null
    } else if (depth === 1 && token.text === ',') {
      column = null
    } else if (depth === 1 && column === null) {
      column = token.name ?? token.text
    } else if (
      depth === 1 &&
      column !== null &&
      token.text.toUpperCase() === 'GENERATED'
    ) {
      generated.add(column)
    }
  }
  return generated
}

export const duckdbColumns = async (
  db: Kysely<DuckdbDatabase>,
  filter: ColumnsFilter
) => {
  const [columns, tablesWithGenerated] = await Promise.all([
    db
      .selectFrom('duckdb_columns as c')
      .select((eb) => [
        'c.schema_name as schema',
        'c.table_name as table',
        'c.column_name as id',
        'c.column_default as default',
        'c.data_type as type',
        'c.comment',
        'c.is_nullable as nullable',
        'c.character_maximum_length as maxLength',
        'c.numeric_precision as precision',
        'c.numeric_scale as scale',
        eb
          .not(
            eb.exists(
              eb
                .selectFrom('duckdb_views as v')
                .select('v.view_name')
                .whereRef('v.database_name', '=', 'c.database_name')
                .whereRef('v.schema_name', '=', 'c.schema_name')
                .whereRef('v.view_name', '=', 'c.table_name')
            )
          )
          .as('editable'),
      ])
      .where('c.database_name', '=', sql<string>`current_database()`)
      .$call((qb) =>
        filter
          ? qb
              .where('c.schema_name', '=', filter.schema)
              .where('c.table_name', '=', filter.table)
          : qb
      )
      .orderBy('c.schema_name')
      .orderBy('c.table_name')
      .orderBy('c.column_index')
      .execute(),
    db
      .selectFrom('duckdb_tables')
      .select(['schema_name', 'table_name', 'sql'])
      .where('database_name', '=', sql<string>`current_database()`)
      .where('sql', 'like', GENERATED_DEFINITION)
      .$call((qb) =>
        filter
          ? qb
              .where('schema_name', '=', filter.schema)
              .where('table_name', '=', filter.table)
          : qb
      )
      .execute(),
  ])
  const generated = new Map(
    tablesWithGenerated.map((table) => [
      `${table.schema_name}.${table.table_name}`,
      generatedColumns(table.sql),
    ])
  )
  return columns.map((column) => {
    const isGenerated =
      generated.get(`${column.schema}.${column.table}`)?.has(column.id) ?? false
    return {
      ...column,
      default: isGenerated ? null : column.default,
      editable: column.editable && !isGenerated,
      isArray: column.type.endsWith('[]'),
      isGenerated,
    }
  })
}
