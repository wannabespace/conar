import { unsupported } from '@tamery/shared/utils/unsupported'
import { sql } from 'kysely'

import { createQuery } from '../../runtime/query'
import type { PolicyTarget } from './shape'
import { expression, policyOn, roleList } from './shape'

export const alterPolicyQuery = ({
  check,
  newName,
  roles,
  using,
  ...target
}: PolicyTarget & {
  check: string | null
  newName: string | null
  roles: string[] | null
  using: string | null
}) => {
  const policy = policyOn(target)

  return createQuery({
    query: {
      clickhouse: unsupported('Row policies'),
      mssql: unsupported('Row policies'),
      mysql: unsupported('Row policies'),
      postgres: (db) =>
        db.transaction().execute(async (tx) => {
          await sql`
            ALTER POLICY ${policy}
            ${roles ? sql`TO ${roleList(roles)}` : sql``}
            ${expression('USING', using)}
            ${expression('WITH CHECK', check)}
          `.execute(tx)

          if (newName) {
            await sql`ALTER POLICY ${policy} RENAME TO ${sql.id(newName)}`.execute(
              tx
            )
          }
        }),
    },
  })
}
