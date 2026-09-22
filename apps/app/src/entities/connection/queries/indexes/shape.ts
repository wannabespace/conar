import { sql } from 'kysely'

import { identifiers } from '../shared/sql-fragments'

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

export interface IndexTarget {
  name: string
  schema: string
  table: string
}
