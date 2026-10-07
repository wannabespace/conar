import { unsupported } from '@tamery/shared/unsupported'
import { sql } from 'kysely'

import { createQuery } from '~/core/runtime/query'

export const createViewQuery = ({
  materialized,
  query,
  schema,
  view,
}: {
  materialized: boolean
  query: string
  schema: string
  view: string
}) => {
  const definition = sql.raw(query)

  return createQuery({
    query: {
      // A ClickHouse materialized view stores rows in a table engine it must be given. POPULATE is refused on Cloud and Replicated databases.
      clickhouse: (db) =>
        materialized
          ? sql`create materialized view ${sql.id(schema, view)} engine = MergeTree order by tuple() as ${definition}`.execute(
              db
            )
          : db
              .withSchema(schema)
              .schema.createView(view)
              .as(definition)
              .execute(),
      mssql: materialized
        ? unsupported('Materialized views')
        : (db) =>
            db
              .withSchema(schema)
              .schema.createView(view)
              .as(definition)
              .execute(),
      mysql: materialized
        ? unsupported('Materialized views')
        : (db) =>
            db
              .withSchema(schema)
              .schema.createView(view)
              .as(definition)
              .execute(),
      postgres: (db) => {
        const create = db.withSchema(schema).schema.createView(view)

        return (materialized ? create.materialized() : create)
          .as(definition)
          .execute()
      },
    },
  })
}
