import { sql } from 'kysely'
import { memoize } from 'memoza'

import { createQuery } from '../runtime/query'

export const renameColumnQuery = memoize(
  ({
    schema,
    table,
    oldColumn,
    newColumn,
  }: {
    schema: string
    table: string
    oldColumn: string
    newColumn: string
  }) =>
    createQuery({
      query: {
        clickhouse: (db) =>
          db
            .withSchema(schema)
            .$extendTables<{ [table]: Record<string, unknown> }>()
            .schema.alterTable(table)
            .renameColumn(oldColumn, newColumn)
            .execute(),
        mssql: async (db) => {
          await sql`EXEC sp_rename ${sql.val(`${schema}.${table}.${oldColumn}`)}, ${sql.val(newColumn)}, 'COLUMN'`.execute(
            db
          )
        },
        mysql: (db) =>
          db
            .withSchema(schema)
            .$extendTables<{ [table]: Record<string, unknown> }>()
            .schema.alterTable(table)
            .renameColumn(oldColumn, newColumn)
            .execute(),
        postgres: (db) =>
          db
            .withSchema(schema)
            .$extendTables<{ [table]: Record<string, unknown> }>()
            .schema.alterTable(table)
            .renameColumn(oldColumn, newColumn)
            .execute(),
      },
    })
)
