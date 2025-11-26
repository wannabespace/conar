import { createQuery } from '../query'

export const insertRecordQuery = createQuery({
  query: ({
    schema,
    table,
    columns,
    values,
  }: {
    schema: string
    table: string
    columns: string[]
    values: unknown[]
  }) => ({
    postgres: ({ db }) => {
      const payload = Object.fromEntries(
        columns.map((col, idx) => [col, values[idx]]),
      )

      return db
        .withSchema(schema as unknown as never)
        .insertInto(table as unknown as never)
        .values(payload as never)
        .execute()
    },
    mysql: ({ db }) => {
      const payload = Object.fromEntries(
        columns.map((col, idx) => [col, values[idx]]),
      )

      return db
        .withSchema(schema as unknown as never)
        .insertInto(table as unknown as never)
        .values(payload as never)
        .execute()
    },
  }),
})
