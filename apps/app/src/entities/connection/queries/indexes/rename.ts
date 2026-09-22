import { sql } from 'kysely'

import { mssqlQualified } from '../shared/sql-fragments'
import { statementQuery } from '../shared/statements'
import type { IndexTarget } from './shape'

export const renameIndexQuery = ({
  name,
  newName,
  schema,
  table,
}: IndexTarget & { newName: string }) =>
  statementQuery('Renaming indexes', {
    mssql: sql`EXEC sp_rename ${sql.lit(mssqlQualified(schema, table, name))}, ${sql.lit(newName)}, 'INDEX'`,
    mysql: sql`ALTER TABLE ${sql.id(schema, table)} RENAME INDEX ${sql.id(name)} TO ${sql.id(newName)}`,
    postgres: sql`ALTER INDEX ${sql.id(schema, name)} RENAME TO ${sql.id(newName)}`,
  })
