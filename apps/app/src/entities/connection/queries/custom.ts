import { type } from 'arktype'
import { CompiledQuery } from 'kysely'

import { createQuery } from '../runtime/query'

const customType = type({ rows: 'Record<string, unknown>[]' }).pipe(
  ({ rows }) => rows
)

export const customQuery = ({
  query,
  values,
}: {
  query: string
  values?: unknown[]
}) =>
  createQuery({
    query: {
      clickhouse: (db) => db.executeQuery(CompiledQuery.raw(query, values)),
      mssql: (db) => db.executeQuery(CompiledQuery.raw(query, values)),
      mysql: (db) => db.executeQuery(CompiledQuery.raw(query, values)),
      postgres: (db) => db.executeQuery(CompiledQuery.raw(query, values)),
    },
    type: customType,
  })
