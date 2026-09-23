import { unsupported } from '@tamery/shared/unsupported'
import { sql } from 'kysely'

import { createQuery } from '../../runtime/query'
import { mssqlQualified } from '../shared/sql-fragments'
import type { SecurityPolicyTarget, SecurityPredicate } from './shape'
import { securityPolicyOf, securityPredicate } from './shape'

export const alterSecurityPolicyQuery = ({
  added,
  dropped,
  newName,
  ...target
}: SecurityPolicyTarget & {
  added: SecurityPredicate[]
  dropped: SecurityPredicate[]
  newName: string | null
}) =>
  createQuery({
    query: {
      clickhouse: unsupported('Security policies'),
      mssql: (db) =>
        db.transaction().execute(async (tx) => {
          // A table holds one predicate per kind and operation, so a changed
          // predicate drops before its replacement adds.
          if (dropped.length > 0) {
            await sql`ALTER SECURITY POLICY ${securityPolicyOf(target)} ${sql.join(dropped.map(securityPredicate.drop))}`.execute(
              tx
            )
          }
          if (added.length > 0) {
            await sql`ALTER SECURITY POLICY ${securityPolicyOf(target)} ${sql.join(added.map(securityPredicate.add))}`.execute(
              tx
            )
          }
          if (newName) {
            await sql`EXEC sp_rename ${sql.val(mssqlQualified(target.schema, target.name))}, ${sql.val(newName)}`.execute(
              tx
            )
          }
        }),
      mysql: unsupported('Security policies'),
      postgres: unsupported('Security policies'),
    },
  })
