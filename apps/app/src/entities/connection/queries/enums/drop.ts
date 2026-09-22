import { unsupported } from '@tamery/shared/unsupported'

import { createQuery } from '../../runtime/query'

export const dropEnumQuery = ({
  cascade,
  name,
  schema,
}: {
  cascade: boolean
  name: string
  schema: string
}) =>
  createQuery({
    query: {
      clickhouse: unsupported('Editing enums'),
      mssql: unsupported('Editing enums'),
      mysql: unsupported('Editing enums'),
      postgres: (db) =>
        db
          .withSchema(schema)
          .schema.dropType(name)
          .$call((qb) => (cascade ? qb.cascade() : qb))
          .execute(),
    },
  })
