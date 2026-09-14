import { sql } from 'kysely'

import { createQuery } from '../../runtime/query'
import { unsupported } from '../shared/unsupported'

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
      clickhouse: unsupported('Dropping enums'),
      mssql: unsupported('Enums'),
      mysql: unsupported('Dropping enums'),
      postgres: (db) =>
        sql`DROP TYPE ${sql.id(schema, name)}${cascade ? sql` CASCADE` : sql``}`.execute(
          db
        ),
    },
  })
