import { CompiledQuery } from 'kysely'
import { createQuery } from '../query'

export function customQuery({ query, values }: { query: string, values?: unknown[] }) {
  return createQuery({
    query: {
      postgres: db => db.executeQuery(CompiledQuery.raw(query, values)),
      mysql: db => db.executeQuery(CompiledQuery.raw(query, values)),
      mssql: db => db.executeQuery(CompiledQuery.raw(query, values)),
      clickhouse: db => db.executeQuery(CompiledQuery.raw(query, values)),
      sqlite: db => db.executeQuery(CompiledQuery.raw(query, values)),
    },
  })
}
