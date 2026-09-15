import { sql } from 'kysely'

import { createQuery } from '../../runtime/query'
import { identifiers } from '../shared/sql-fragments'
import { unsupported } from '../shared/unsupported'

export interface IndexShape {
  columns: string[]
  name: string
  schema: string
  table: string
  unique?: boolean
}

export const createIndexStatement = ({
  columns,
  name,
  schema,
  table,
  unique,
}: IndexShape) =>
  sql`CREATE ${unique ? sql`UNIQUE ` : sql``}INDEX ${sql.id(name)} ON ${sql.id(schema, table)} (${identifiers(columns)})`

export const createIndexQuery = (shape: IndexShape) => {
  const create = createIndexStatement(shape)

  return createQuery({
    query: {
      clickhouse: unsupported('Creating indexes'),
      mssql: (db) => create.execute(db),
      mysql: (db) => create.execute(db),
      postgres: (db) => create.execute(db),
    },
  })
}
