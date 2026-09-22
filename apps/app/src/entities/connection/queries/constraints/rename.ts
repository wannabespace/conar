import { sql } from 'kysely'

import { mssqlQualified } from '../shared/sql-fragments'
import { statementQuery } from '../shared/statements'
import type { ConstraintTarget } from './shape'

export const renameConstraintQuery = ({
  name,
  newName,
  schema,
  table,
}: ConstraintTarget & { newName: string }) =>
  statementQuery('Renaming constraints', {
    mssql: sql`EXEC sp_rename ${sql.lit(mssqlQualified(schema, name))}, ${sql.lit(newName)}, 'OBJECT'`,
    postgres: sql`ALTER TABLE ${sql.id(schema, table)} RENAME CONSTRAINT ${sql.id(name)} TO ${sql.id(newName)}`,
  })
