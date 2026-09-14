import type { Kysely } from 'kysely'

import { createQuery } from '../../runtime/query'
import { unsupported } from '../shared/unsupported'

export const createIndexQuery = ({
  schema,
  table,
  name,
  columns,
  unique,
}: {
  schema: string
  table: string
  name: string
  columns: string[]
  unique?: boolean
}) => {
  // oxlint-disable-next-line ts/no-explicit-any
  const create = (db: Kysely<any>) => {
    const query = db
      .withSchema(schema)
      .schema.createIndex(name)
      .on(table)
      .columns(columns)

    return (unique ? query.unique() : query).execute()
  }

  return createQuery({
    query: {
      clickhouse: unsupported('Creating indexes'),
      mssql: create,
      mysql: create,
      postgres: create,
    },
  })
}
