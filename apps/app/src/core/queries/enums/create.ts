import { unsupported } from '@tamery/shared/unsupported'

import { createQuery } from '~/core/runtime/query'

export const createEnumQuery = ({
  name,
  schema,
  values,
}: {
  name: string
  schema: string
  values: string[]
}) =>
  createQuery({
    query: {
      clickhouse: unsupported('Editing enums'),
      duckdb: (db) =>
        db.withSchema(schema).schema.createType(name).asEnum(values).execute(),
      mssql: unsupported('Editing enums'),
      mysql: unsupported('Editing enums'),
      postgres: (db) =>
        db.withSchema(schema).schema.createType(name).asEnum(values).execute(),
      sqlite: unsupported('Editing enums'),
    },
  })
