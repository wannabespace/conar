import { unsupported } from '@tamery/shared/unsupported'
import { sql } from 'kysely'

import { createQuery } from '../../runtime/query'
import type { PolicyKind, PolicyTarget } from './shape'
import { clickhouseRoleList, expression, policyOn, roleList } from './shape'

export const alterPolicyQuery = ({
  check,
  kind,
  newName,
  roles,
  using,
  ...target
}: PolicyTarget & {
  check: string | null
  kind: PolicyKind | null
  newName: string | null
  roles: string[] | null
  using: string | null
}) => {
  const policy = policyOn(target)

  return createQuery({
    query: {
      // An empty USING removes the filter, which only ClickHouse alters in place.
      clickhouse: (db) =>
        sql`
          ALTER ROW POLICY ${policy}
          ${newName ? sql`RENAME TO ${sql.id(newName)}` : sql``}
          ${kind ? sql`AS ${sql.raw(kind)}` : sql``}
          ${using === '' ? sql`USING NONE` : expression('USING', using)}
          ${roles ? sql`TO ${clickhouseRoleList(roles)}` : sql``}
        `.execute(db),
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
