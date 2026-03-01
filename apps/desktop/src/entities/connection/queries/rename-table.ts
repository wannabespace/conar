import { memoize } from '@conar/shared/utils/helpers'
import { sql } from 'kysely'
import { createQuery } from '../query'

export const renameTableQuery = memoize(({ schema, oldTable, newTable }: { schema: string, oldTable: string, newTable: string }) => createQuery({
  query: {
    postgres: db => db
      .withSchema(schema)
      .withTables<{ [oldTable]: Record<string, unknown> }>()
      .schema
      .alterTable(oldTable)
      .renameTo(newTable)
      .execute(),
    mysql: db => db
      .withSchema(schema)
      .withTables<{ [oldTable]: Record<string, unknown> }>()
      .schema
      .alterTable(oldTable)
      .renameTo(newTable)
      .execute(),
    mssql: db => db
      .withSchema(schema)
      .withTables<{ [oldTable]: Record<string, unknown> }>()
      .schema
      .alterTable(oldTable)
      .renameTo(newTable)
      .execute(),
    clickhouse: db => sql`RENAME TABLE ${sql.id(schema, oldTable)} TO ${sql.id(schema, newTable)}`.execute(db),
    sqlite: db => db
      .withSchema(schema)
      .withTables<{ [oldTable]: Record<string, unknown> }>()
      .schema
      .alterTable(oldTable)
      .renameTo(newTable)
      .execute(),
  },
}))
