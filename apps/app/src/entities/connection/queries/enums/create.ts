import { unsupported } from '@tamery/shared/unsupported'
import { sql } from 'kysely'

import { createQuery } from '../../runtime/query'
import { literals } from '../shared/sql-fragments'

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
        sql`CREATE TYPE ${sql.id(schema, name)} AS ENUM (${literals(values)})`.execute(
          db
        ),
    },
  })
