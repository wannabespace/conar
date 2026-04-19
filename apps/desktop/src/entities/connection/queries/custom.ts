import { type } from 'arktype'
import { CompiledQuery } from 'kysely'
import { createQuery } from '../query'

const customType = type({ 'rows?': 'Record<string, unknown>[]' }).pipe(({ rows }) => rows ?? [])

export function customQuery({ query, values }: { query: string, values?: unknown[] }) {
  return createQuery({
    type: customType,
    query: {
      postgres: db => db.executeQuery(CompiledQuery.raw(query, values)),
      mysql: db => db.executeQuery(CompiledQuery.raw(query, values)),
      mssql: db => db.executeQuery(CompiledQuery.raw(query, values)),
      clickhouse: db => db.executeQuery(CompiledQuery.raw(query, values)),
    },
  })
}
