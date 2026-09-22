import { unsupported } from '@tamery/shared/utils/unsupported'
import { sql } from 'kysely'

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
        sql`DROP TYPE ${sql.id(schema, name)}${cascade ? sql` CASCADE` : sql``}`.execute(
          db
        ),
    },
  })
