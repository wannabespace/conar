import { sql } from 'kysely'

import type { DropStatements } from '../shared/drop'
import { dropStatementsQuery } from '../shared/drop'

export const dropTriggerStatements = ({
  name,
  schema,
  table,
}: {
  name: string
  schema: string
  table: string
}): DropStatements => {
  const dropByName = sql`DROP TRIGGER ${sql.id(schema, name)}`

  return {
    mssql: dropByName,
    mysql: dropByName,
    postgres: sql`DROP TRIGGER ${sql.id(name)} ON ${sql.id(schema, table)}`,
  }
}

export const dropTriggerQuery = (
  params: Parameters<typeof dropTriggerStatements>[0]
) => dropStatementsQuery(dropTriggerStatements(params), 'Triggers')
