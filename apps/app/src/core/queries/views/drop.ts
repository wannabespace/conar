import { createQuery } from '~/core/runtime/query'

export const dropViewQuery = ({
  cascade,
  materialized,
  schema,
  view,
}: {
  cascade: boolean
  materialized: boolean
  schema: string
  view: string
}) =>
  createQuery({
    query: {
      clickhouse: (db) => db.withSchema(schema).schema.dropView(view).execute(),
      mssql: (db) => db.withSchema(schema).schema.dropView(view).execute(),
      mysql: (db) => db.withSchema(schema).schema.dropView(view).execute(),
      postgres: (db) => {
        const drop = db.withSchema(schema).schema.dropView(view)
        const kind = materialized ? drop.materialized() : drop

        return (cascade ? kind.cascade() : kind).execute()
      },
    },
  })
