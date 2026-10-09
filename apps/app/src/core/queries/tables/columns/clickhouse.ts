import type { Kysely } from 'kysely'
import { sql } from 'kysely'

import type { Database as ClickhouseDatabase } from '~/core/runtime/dialects/clickhouse/schema'

import type { ColumnsFilter } from '../shape'

const clickhouseEnumRegex = /^Enum\d+/u

const clickhouseNullableRegex = /^(?:LowCardinality\()?Nullable\(/u

const clickhouseWithoutNullable = (sqlType: string) =>
  sqlType.replace(
    /^(?<wrapper>LowCardinality\()?Nullable\((?<inner>.*)\)$/u,
    '$<wrapper>$<inner>'
  )

const getClickhouseColumnType = (sqlType: string): string => {
  if (sqlType.startsWith('Array(') && sqlType.endsWith(')')) {
    return `${getClickhouseColumnType(sqlType.slice(6, -1))}[]`
  }

  if (sqlType.startsWith('Nullable(') && sqlType.endsWith(')')) {
    return getClickhouseColumnType(sqlType.slice(9, -1))
  }

  if (sqlType.startsWith('LowCardinality(') && sqlType.endsWith(')')) {
    return getClickhouseColumnType(sqlType.slice(15, -1))
  }

  if (sqlType.startsWith('Enum')) {
    return sqlType.match(clickhouseEnumRegex)?.[0] || 'Enum'
  }

  return sqlType
}

export const clickhouseColumns = async (
  db: Kysely<ClickhouseDatabase>,
  filter: ColumnsFilter
) => {
  const query = await db
    .selectFrom('system.columns')
    .select([
      'database as schema',
      'table',
      'name as id',
      'default_expression as default',
      'type',
      (eb) =>
        eb.fn<string | null>('nullIf', ['comment', eb.val('')]).as('comment'),
      sql<boolean>`default_kind IN ('MATERIALIZED', 'ALIAS')`.as('isGenerated'),
      // ClickHouse refuses to UPDATE a sorting or primary key column.
      sql<boolean>`default_kind NOT IN ('MATERIALIZED', 'ALIAS') AND NOT is_in_sorting_key AND NOT is_in_primary_key`.as(
        'editable'
      ),
    ])
    .$call((qb) =>
      filter
        ? qb.where(({ and, eb }) =>
            and([
              eb('database', '=', filter.schema),
              eb('table', '=', filter.table),
            ])
          )
        : qb.where('database', 'not in', ['system', 'information_schema'])
    )
    .orderBy('database')
    .orderBy('table')
    .orderBy('position')
    .execute()

  return query.map((row) => ({
    ...row,
    declaredType: clickhouseWithoutNullable(row.type),
    enumName: row.type.includes('Enum') ? row.id : undefined,
    isArray: row.type.includes('Array('),
    nullable: clickhouseNullableRegex.test(row.type),
    typeLabel: getClickhouseColumnType(row.type),
  }))
}
