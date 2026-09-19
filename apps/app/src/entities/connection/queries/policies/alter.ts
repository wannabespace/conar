import { unsupported } from '@tamery/shared/utils/unsupported'
import { sql } from 'kysely'

import { createQuery } from '../../runtime/query'
import { expression, roleList } from './shape'

export const alterPolicyQuery = ({
  check,
  name,
  roles,
  schema,
  table,
  using,
}: {
  check: string | null
  name: string
  roles: string[] | null
  schema: string
  table: string
  using: string | null
}) =>
  createQuery({
    query: {
      clickhouse: unsupported('Editing row policies'),
      mssql: unsupported('Editing security policies'),
      mysql: unsupported('Editing privileges'),
      postgres: (db) =>
        sql`ALTER POLICY ${sql.id(name)} ON ${sql.id(schema, table)}${roles ? sql` TO ${roleList(roles)}` : sql``}${expression('USING', using)}${expression('WITH CHECK', check)}`.execute(
          db
        ),
    },
  })
