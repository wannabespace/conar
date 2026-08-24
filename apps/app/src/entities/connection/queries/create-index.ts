import { memoize } from 'memoza'

import { createQuery } from '../runtime/query'

export const createIndexQuery = memoize(
  ({
    schema,
    table,
    name,
    columns,
    unique,
  }: {
    schema: string
    table: string
    name: string
    columns: string[]
    unique?: boolean
  }) =>
    createQuery({
      query: {
        clickhouse: () => {
          throw new Error('ClickHouse does not support CREATE INDEX')
        },
        mssql: (db) => {
          const query = db
            .withSchema(schema)
            .schema.createIndex(name)
            .on(table)
            .columns(columns)

          return (unique ? query.unique() : query).execute()
        },
        mysql: (db) => {
          const query = db
            .withSchema(schema)
            .schema.createIndex(name)
            .on(table)
            .columns(columns)

          return (unique ? query.unique() : query).execute()
        },
        postgres: (db) => {
          const query = db
            .withSchema(schema)
            .schema.createIndex(name)
            .on(table)
            .columns(columns)

          return (unique ? query.unique() : query).execute()
        },
      },
    })
)
