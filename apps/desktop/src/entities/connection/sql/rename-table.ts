import { sql } from 'kysely'
import { createQuery } from '../query'

export const renameTableQuery = createQuery({
  query: ({ schema, oldTable, newTable }: { schema: string, oldTable: string, newTable: string }) => {
    const pgLike = (db: Parameters<ReturnType<Parameters<typeof createQuery>[0]['query']>['postgres']>[0]) => db
      .withSchema(schema)
      .withTables<{ [oldTable]: Record<string, unknown> }>()
      .schema
      .alterTable(oldTable)
      .renameTo(newTable)
      .execute()
    return {
      postgres: pgLike,
      supabase: pgLike,
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
    }
  },
})
