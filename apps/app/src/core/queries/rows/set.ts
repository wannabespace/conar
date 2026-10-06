import type { ActiveFilter } from '@tamery/shared/filters'
import { toKyselyFilter } from '@tamery/shared/filters'
import type { Kysely } from 'kysely'

import { createQuery } from '~/core/runtime/query'

interface SetParams {
  schema: string
  table: string
  values: Record<string, unknown>
  filters: ActiveFilter[]
}

const updateRows = (
  // oxlint-disable-next-line ts/no-explicit-any
  db: Kysely<any>,
  { schema, table, values, filters }: SetParams
) =>
  db
    .withSchema(schema)
    .$extendTables<Record<string, Record<string, unknown>>>()
    .updateTable(table)
    .set(values)
    .where((eb) => toKyselyFilter(eb, filters))
    .execute()

export const setQuery = (params: SetParams) =>
  createQuery({
    query: {
      clickhouse: (db) => updateRows(db, params),
      mssql: (db) => updateRows(db, params),
      mysql: (db) => updateRows(db, params),
      postgres: (db) => updateRows(db, params),
    },
  })
