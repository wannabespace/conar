import { memoize } from '@conar/shared/utils/helpers'
import { sql } from 'kysely'
import { createQuery } from '../query'

export const renameColumnQuery = memoize(({ schema, table, oldColumn, newColumn }: { schema: string, table: string, oldColumn: string, newColumn: string }) => createQuery({
  query: {
    postgres: db => db
      .withSchema(schema)
      .withTables<{ [table]: Record<string, unknown> }>()
      .schema
      .alterTable(table)
      .renameColumn(oldColumn, newColumn)
      .execute(),
    mysql: db => db
      .withSchema(schema)
      .withTables<{ [table]: Record<string, unknown> }>()
      .schema
      .alterTable(table)
      .renameColumn(oldColumn, newColumn)
      .execute(),
    mssql: async (db) => {
      await sql`EXEC sp_rename ${sql.val(`${schema}.${table}.${oldColumn}`)}, ${sql.val(newColumn)}, 'COLUMN'`.execute(db)
    },
    clickhouse: db => db
      .withSchema(schema)
      .withTables<{ [table]: Record<string, unknown> }>()
      .schema
      .alterTable(table)
      .renameColumn(oldColumn, newColumn)
      .execute(),
    sqlite: db => db
      .withSchema(schema)
      .withTables<{ [table]: Record<string, unknown> }>()
      .schema
      .alterTable(table)
      .renameColumn(oldColumn, newColumn)
      .execute(),
  },
}))
