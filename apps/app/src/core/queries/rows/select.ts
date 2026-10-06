import type { ActiveFilter } from '@tamery/shared/filters'
import { toKyselyFilter } from '@tamery/shared/filters'
import { type } from 'arktype'
import type { Kysely } from 'kysely'
import { memoize } from 'memoza'

import { createQuery } from '~/core/runtime/query'

interface SelectParams {
  schema: string
  table: string
  select: string[]
  filters: ActiveFilter[]
}

const selectRows = (
  // oxlint-disable-next-line ts/no-explicit-any
  db: Kysely<any>,
  { schema, table, select, filters }: SelectParams
) =>
  db
    .withSchema(schema)
    .$extendTables<Record<string, Record<string, unknown>>>()
    .selectFrom(table)
    .select(select)
    .where((eb) => toKyselyFilter(eb, filters))
    .execute()

export const selectQuery = memoize((params: SelectParams) =>
  createQuery({
    query: {
      clickhouse: (db) => selectRows(db, params),
      mssql: (db) => selectRows(db, params),
      mysql: (db) => selectRows(db, params),
      postgres: (db) => selectRows(db, params),
    },
    type: type('Record<string, unknown>[]'),
  })
)
