import { sql } from 'kysely'

import { statementQuery } from '../shared/statements'
import type { IndexTarget } from './shape'

export const dropIndexQuery = ({ name, schema, table }: IndexTarget) =>
  statementQuery('Dropping indexes', {
    mssql: sql`DROP INDEX ${sql.id(name)} ON ${sql.id(schema, table)}`,
    mysql: sql`ALTER TABLE ${sql.id(schema, table)} DROP INDEX ${sql.id(name)}`,
    postgres: sql`DROP INDEX ${sql.id(schema, name)}`,
  })
