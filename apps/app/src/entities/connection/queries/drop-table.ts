import { memoize } from 'memoza'

import { createQuery } from '../runtime/query'

export const dropTableQuery = memoize(
  ({
    table,
    schema,
    cascade,
  }: {
    table: string
    schema: string
    cascade: boolean
  }) =>
    createQuery({
      query: {
        clickhouse: (db) =>
          db
            .withSchema(schema)
            .$extendTables<{ [table]: Record<string, unknown> }>()
            .schema.dropTable(table)
            .execute(),
        mssql: (db) => {
          let query = db
            .withSchema(schema)
            .$extendTables<{ [table]: Record<string, unknown> }>()
            .schema.dropTable(table)

          if (cascade) {
            query = query.cascade()
          }

          return query.execute()
        },
        mysql: (db) => {
          let query = db
            .withSchema(schema)
            .$extendTables<{ [table]: Record<string, unknown> }>()
            .schema.dropTable(table)

          if (cascade) {
            query = query.cascade()
          }

          return query.execute()
        },
        postgres: (db) => {
          let query = db
            .withSchema(schema)
            .$extendTables<{ [table]: Record<string, unknown> }>()
            .schema.dropTable(table)

          if (cascade) {
            query = query.cascade()
          }

          return query.execute()
        },
      },
    })
)
