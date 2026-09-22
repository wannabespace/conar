import { memoize } from 'memoza'

import { createQuery } from '../../runtime/query'

export const deleteRowsQuery = memoize(
  ({
    table,
    schema,
    primaryKeys,
  }: {
    table: string
    schema: string
    primaryKeys: Record<string, unknown>[]
  }) =>
    createQuery({
      query: {
        clickhouse: (db) =>
          db
            .withSchema(schema)
            .$extendTables<{ [table]: Record<string, unknown> }>()
            .deleteFrom(table)
            .where(({ or, and, eb }) =>
              or(
                primaryKeys.map((pk) =>
                  and(
                    Object.entries(pk).map(([key, value]) =>
                      eb(key, '=', value)
                    )
                  )
                )
              )
            )
            .execute(),
        mssql: (db) =>
          db
            .withSchema(schema)
            .$extendTables<{ [table]: Record<string, unknown> }>()
            .deleteFrom(table)
            .where(({ or, and, eb }) =>
              or(
                primaryKeys.map((pk) =>
                  and(
                    Object.entries(pk).map(([key, value]) =>
                      eb(key, '=', value)
                    )
                  )
                )
              )
            )
            .execute(),
        mysql: (db) =>
          db
            .withSchema(schema)
            .$extendTables<{ [table]: Record<string, unknown> }>()
            .deleteFrom(table)
            .where(({ or, and, eb }) =>
              or(
                primaryKeys.map((pk) =>
                  and(
                    Object.entries(pk).map(([key, value]) =>
                      eb(key, '=', value)
                    )
                  )
                )
              )
            )
            .execute(),
        postgres: (db) =>
          db
            .withSchema(schema)
            .$extendTables<{ [table]: Record<string, unknown> }>()
            .deleteFrom(table)
            .where(({ or, and, eb }) =>
              or(
                primaryKeys.map((pk) =>
                  and(
                    Object.entries(pk).map(([key, value]) =>
                      eb(key, '=', value)
                    )
                  )
                )
              )
            )
            .execute(),
      },
    })
)
