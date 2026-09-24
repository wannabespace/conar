import { type } from 'arktype'
import { CompiledQuery } from 'kysely'

import { createQuery } from '../../runtime/query'

export const resultSetType = type({
  affectedRows: 'number | null',
  columns: 'string[]',
  rows: 'unknown[][]',
  truncated: 'boolean',
})

export type ResultSet = typeof resultSetType.infer

/** With `resultSets` on, the driver hands the sets back where Kysely expects rows. */
export const resultSetsType = type({ rows: resultSetType.array() }).pipe(
  ({ rows }) => rows
)

/**
 * A user-written statement, run with `resultSets` query params. No result `type` on purpose: it may
 * write, and a write must not retry on reconnect, so the sets are checked inside instead. `queryId`
 * lets the caller cancel it.
 */
export const customQuery = ({
  query,
  values,
}: {
  query: string
  values?: unknown[]
}) => {
  const compiled = CompiledQuery.raw(query, values)
  return {
    ...createQuery({
      minDuration: 0,
      query: {
        clickhouse: async (db) =>
          resultSetsType.assert(await db.executeQuery(compiled)),
        mssql: async (db) =>
          resultSetsType.assert(await db.executeQuery(compiled)),
        mysql: async (db) =>
          resultSetsType.assert(await db.executeQuery(compiled)),
        postgres: async (db) =>
          resultSetsType.assert(await db.executeQuery(compiled)),
      },
    }),
    queryId: compiled.queryId.queryId,
  }
}
