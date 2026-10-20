import type { ActiveFilter, FilterValueBinding } from '@tamery/shared/filters'
import { toKyselyFilter } from '@tamery/shared/filters'
import type { Kysely } from 'kysely'
import { sql } from 'kysely'

// Columns go through `sql.id`: a plain string is parsed, so `first name` reads as a column and a direction, `a.b` as a table and a column.
export const selectPage = (
  // oxlint-disable-next-line ts/no-explicit-any
  db: Kysely<any>,
  {
    filters,
    filtersConcatOperator,
    limit,
    offset,
    orderBy = {},
    schema,
    select,
    table,
  }: {
    filters?: ActiveFilter[]
    filtersConcatOperator?: 'AND' | 'OR'
    limit: number
    offset: number
    orderBy?: Record<string, 'ASC' | 'DESC'>
    schema: string
    select?: string[]
    table: string
  },
  bind?: FilterValueBinding
) => {
  let query = db
    .withSchema(schema)
    .$extendTables<{ [table]: Record<string, unknown> }>()
    .selectFrom(table)

  query =
    select === undefined
      ? query.selectAll()
      : query.select(select.map((column) => sql.id(column).as(column)))

  if (filters !== undefined) {
    query = query.where((eb) =>
      toKyselyFilter(eb, filters, filtersConcatOperator, bind)
    )
  }

  for (const [column, direction] of Object.entries(orderBy)) {
    query = query.orderBy(sql.id(column), direction === 'ASC' ? 'asc' : 'desc')
  }

  return query.limit(limit).offset(offset)
}
