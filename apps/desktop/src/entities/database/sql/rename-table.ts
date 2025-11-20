import { createQuery } from '../query'

export const renameTableQuery = createQuery({
  query: ({ schema, oldTable, newTable }: { schema: string, oldTable: string, newTable: string }) => ({
    postgres: ({ db }) => db
      .withSchema(schema)
      .withTables<{ [oldTable]: Record<string, unknown> }>()
      .schema
      .alterTable(oldTable)
      .renameTo(newTable)
      .execute(),
    mysql: ({ db }) => db
      .withSchema(schema)
      .withTables<{ [oldTable]: Record<string, unknown> }>()
      .schema
      .alterTable(oldTable)
      .renameTo(newTable)
      .execute(),
  }),
})
