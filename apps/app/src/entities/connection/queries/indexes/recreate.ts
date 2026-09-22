import { sql } from 'kysely'

import { identifiers } from '../shared/sql-fragments'
import { statementQuery } from '../shared/statements'
import type { IndexShape } from './shape'
import { createIndexStatement } from './shape'

export const recreateIndexQuery = ({
  name,
  newName,
  ...shape
}: IndexShape & { newName: string }) => {
  const { columns, schema, table, unique } = shape
  const create = createIndexStatement({ ...shape, name: newName })

  return statementQuery('Editing indexes', {
    mssql: [
      sql`DROP INDEX ${sql.id(name)} ON ${sql.id(schema, table)}`,
      create,
    ],
    // One ALTER drops and adds at once, which InnoDB applies atomically.
    mysql: sql`ALTER TABLE ${sql.id(schema, table)} DROP INDEX ${sql.id(name)}, ADD ${unique ? sql`UNIQUE ` : sql``}INDEX ${sql.id(newName)} (${identifiers(columns)})`,
    postgres: [sql`DROP INDEX ${sql.id(schema, name)}`, create],
  })
}
