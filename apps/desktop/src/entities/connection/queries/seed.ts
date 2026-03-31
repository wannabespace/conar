import { createQuery } from '../query'

const BATCH_SIZE = 500

export function seedQuery({ schema, table, rows }: {
  schema: string
  table: string
  rows: Record<string, unknown>[]
}) {
  const batches: Record<string, unknown>[][] = []
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    batches.push(rows.slice(i, i + BATCH_SIZE))
  }

  return createQuery({
    query: {
      postgres: async db => db.transaction().execute(async (trx) => {
        for (const batch of batches) {
          await trx
            .withSchema(schema)
            .withTables<{ [table: string]: Record<string, unknown> }>()
            .insertInto(table)
            .values(batch)
            .execute()
        }
      }),
      mysql: async db => db.transaction().execute(async (trx) => {
        for (const batch of batches) {
          await trx
            .withSchema(schema)
            .withTables<{ [table: string]: Record<string, unknown> }>()
            .insertInto(table)
            .values(batch)
            .execute()
        }
      }),
      mssql: async db => db.transaction().execute(async (trx) => {
        for (const batch of batches) {
          await trx
            .withSchema(schema)
            .withTables<{ [table: string]: Record<string, unknown> }>()
            .insertInto(table)
            .values(batch)
            .execute()
        }
      }),
      clickhouse: async db => db.transaction().execute(async (trx) => {
        for (const batch of batches) {
          await trx
            .withSchema(schema)
            .withTables<{ [table: string]: Record<string, unknown> }>()
            .insertInto(table)
            .values(batch)
            .execute()
        }
      }),
    },
  })
}
