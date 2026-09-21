import { unsupported } from '@tamery/shared/utils/unsupported'
import { sql } from 'kysely'

import { createQuery } from '../../runtime/query'
import { expression, roleList } from './shape'

export const alterPolicyQuery = ({
  check,
  name,
  newName,
  roles,
  schema,
  table,
  using,
}: {
  check: string | null
  name: string
  newName: string | null
  roles: string[] | null
  schema: string
  table: string
  using: string | null
}) => {
  const policy = sql`${sql.id(name)} ON ${sql.id(schema, table)}`
  const alter = sql`ALTER POLICY ${policy}${roles ? sql` TO ${roleList(roles)}` : sql``}${expression('USING', using)}${expression('WITH CHECK', check)}`

  return createQuery({
    query: {
      clickhouse: unsupported('Editing row policies'),
      mssql: unsupported('Editing security policies'),
      mysql: unsupported('Editing privileges'),
      postgres: (db) =>
        newName
          ? db.transaction().execute(async (tx) => {
              await alter.execute(tx)
              await sql`ALTER POLICY ${policy} RENAME TO ${sql.id(newName)}`.execute(
                tx
              )
            })
          : alter.execute(db),
    },
  })
}
