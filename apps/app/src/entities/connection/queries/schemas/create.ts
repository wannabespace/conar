import { unsupported } from '@tamery/shared/unsupported'

import { createQuery } from '../../runtime/query'

export const createSchemaQuery = (schema: string) =>
  createQuery({
    query: {
      clickhouse: unsupported('Schemas'),
      mssql: (db) => db.schema.createSchema(schema).execute(),
      mysql: (db) => db.schema.createSchema(schema).execute(),
      postgres: (db) => db.schema.createSchema(schema).execute(),
    },
  })
