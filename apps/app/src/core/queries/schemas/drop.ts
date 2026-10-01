import { unsupported } from '@tamery/shared/unsupported'

import { createQuery } from '~/core/runtime/query'

export const dropSchemaQuery = ({
  cascade,
  schema,
}: {
  cascade: boolean
  schema: string
}) =>
  createQuery({
    query: {
      clickhouse: unsupported('Schemas'),
      mssql: (db) => db.schema.dropSchema(schema).execute(),
      mysql: (db) => db.schema.dropSchema(schema).execute(),
      postgres: (db) => {
        const drop = db.schema.dropSchema(schema)
        return (cascade ? drop.cascade() : drop).execute()
      },
    },
  })
