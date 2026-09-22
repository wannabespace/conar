import { unsupported } from '@tamery/shared/unsupported'

import { createQuery } from '../../runtime/query'

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
      mssql: unsupported('Editing enums'),
      mysql: unsupported('Editing enums'),
      postgres: (db) =>
        db.withSchema(schema).schema.createType(name).asEnum(values).execute(),
    },
  })
