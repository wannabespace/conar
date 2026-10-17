import type { Kysely } from 'kysely'

import type { Database as ClickhouseDatabase } from '~/core/runtime/dialects/clickhouse/schema'

import { SKIP_INDEX_TYPES, getSkipIndexColumns } from '../shape'

const clickhouseSkipIndexes = async (db: Kysely<ClickhouseDatabase>) => {
  const rows = await db
    .selectFrom('system.data_skipping_indices')
    .select(['database', 'table', 'name', 'type_full', 'expr', 'granularity'])
    .where('database', 'not in', ['system', 'information_schema'])
    .execute()

  return rows.flatMap((row) => {
    const columns = getSkipIndexColumns(row.expr)
    const custom =
      !columns ||
      !SKIP_INDEX_TYPES.some((skipType) => skipType === row.type_full)
    const index = {
      custom_expression: columns ? null : row.expr,
      granularity: Number(row.granularity),
      index_definition: `INDEX ${row.name} ${row.expr} TYPE ${row.type_full} GRANULARITY ${row.granularity}`,
      index_type: row.type_full,
      is_custom: custom,
      is_primary: false,
      is_unique: false,
      name: row.name,
      schema: row.database,
      table: row.table,
    }

    return (columns ?? [null]).map((column) => ({ ...index, column }))
  })
}

const clickhousePrimaryKeys = async (db: Kysely<ClickhouseDatabase>) => {
  // ClickHouse resolves an alias anywhere in the query: selecting a literal
  // `as name` here would turn `name as column` into that literal.
  const rows = await db
    .selectFrom('system.columns')
    .select(['database as schema', 'table', 'name as column'])
    .where('is_in_primary_key', '=', 1)
    .where('database', 'not in', ['system', 'information_schema'])
    .orderBy('database')
    .orderBy('table')
    .orderBy('position')
    .execute()

  return rows.map((row) => ({
    ...row,
    is_primary: true,
    is_unique: false,
    name: 'primary_key',
  }))
}

export const clickhouseIndexes = async (db: Kysely<ClickhouseDatabase>) => [
  ...(await clickhousePrimaryKeys(db)),
  ...(await clickhouseSkipIndexes(db)),
]
