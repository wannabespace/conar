import { sql } from 'kysely'

import { literals } from '../shared/sql-fragments'
import { statementQuery } from '../shared/statements'

export const createEnumQuery = ({
  name,
  schema,
  values,
}: {
  name: string
  schema: string
  values: string[]
}) =>
  statementQuery('Editing enums', {
    postgres: sql`CREATE TYPE ${sql.id(schema, name)} AS ENUM (${literals(values)})`,
  })
