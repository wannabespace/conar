import { unsupported } from '@tamery/shared/unsupported'
import { sql } from 'kysely'

import { createQuery } from '../../runtime/query'
import { mssqlQualified } from '../shared/sql-fragments'
import type { PolicyKind, PolicyTarget, PolicyPredicate } from './shape'
import {
  clickhouseRoleList,
  expression,
  policyOn,
  roleList,
  policyPredicate,
} from './shape'

export const alterPolicyQuery = ({
  added = [],
  check = null,
  dropped = [],
  kind = null,
  newName,
  roles = null,
  using = null,
  ...target
}: PolicyTarget & {
  // SQL Server alters only predicates and the name; the rest is Postgres and ClickHouse.
  added?: PolicyPredicate[]
  check?: string | null
  dropped?: PolicyPredicate[]
  kind?: PolicyKind | null
  newName: string | null
  roles?: string[] | null
  using?: string | null
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
      mssql: (db) =>
        db.transaction().execute(async (tx) => {
          const policyName = sql.id(target.schema, target.name)

          // A table holds one predicate per kind and operation, so a changed
          // predicate drops before its replacement adds.
          if (dropped.length > 0) {
            await sql`ALTER SECURITY POLICY ${policyName} ${sql.join(dropped.map(policyPredicate.drop))}`.execute(
              tx
            )
          }
          if (added.length > 0) {
            await sql`ALTER SECURITY POLICY ${policyName} ${sql.join(added.map(policyPredicate.add))}`.execute(
              tx
            )
          }
          if (newName) {
            await sql`EXEC sp_rename ${sql.val(mssqlQualified(target.schema, target.name))}, ${sql.val(newName)}`.execute(
              tx
            )
          }
        }),
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
