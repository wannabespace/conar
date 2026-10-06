import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { type } from 'arktype'
import type { Kysely } from 'kysely'

import { createQuery } from '~/core/runtime/query'

import { textContains } from './shape'

const rowsType = type('Record<string, unknown>[]')

interface SearchRowsParams {
  columns: string[]
  limit: number
  schema: string
  table: string
  term: string
}

const searchRows = (
  // oxlint-disable-next-line ts/no-explicit-any
  db: Kysely<any>,
  connectionType: ConnectionType,
  { columns, limit, schema, table, term }: SearchRowsParams
) =>
  db
    .withSchema(schema)
    .$extendTables<Record<string, Record<string, unknown>>>()
    .selectFrom(table)
    .selectAll()
    .$if(term !== '', (query) =>
      query.where((eb) =>
        eb.or(
          columns.map((column) =>
            textContains[connectionType](eb, column, `%${term}%`)
          )
        )
      )
    )
    // SQL Server compiles a limit to OFFSET … FETCH, which needs an ORDER BY this search lacks.
    .$call((query) =>
      connectionType === ConnectionType.MSSQL
        ? query.top(limit)
        : query.limit(limit)
    )
    .execute()

/** `term` matches anywhere in any of `columns` cast to text, case-insensitively; `%` and `_` in it act as wildcards. */
export const searchRowsQuery = (params: SearchRowsParams) =>
  createQuery({
    query: {
      clickhouse: (db) => searchRows(db, ConnectionType.ClickHouse, params),
      mssql: (db) => searchRows(db, ConnectionType.MSSQL, params),
      mysql: (db) => searchRows(db, ConnectionType.MySQL, params),
      postgres: (db) => searchRows(db, ConnectionType.Postgres, params),
    },
    type: rowsType,
  })
