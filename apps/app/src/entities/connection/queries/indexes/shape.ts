import { sql } from 'kysely'

import { identifiers } from '../shared/sql-fragments'

export interface IndexShape {
  columns: string[]
  name: string
  schema: string
  table: string
  unique?: boolean
}

export interface IndexTarget {
  name: string
  schema: string
  table: string
}

export const createIndexStatement = ({
  columns,
  name,
  schema,
  table,
  unique,
}: IndexShape) =>
  sql`CREATE ${unique ? sql`UNIQUE INDEX` : sql`INDEX`} ${sql.id(name)} ON ${sql.id(schema, table)} (${identifiers(columns)})`
