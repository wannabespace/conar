import { unsupported } from '@tamery/shared/unsupported'
import { sql } from 'kysely'

import { createQuery } from '../../runtime/query'
import type { SecurityPolicyTarget, SecurityPredicate } from './shape'
import { securityPolicyOf, securityPredicate } from './shape'

export const createSecurityPolicyQuery = ({
  predicates,
  ...target
}: SecurityPolicyTarget & { predicates: SecurityPredicate[] }) =>
  createQuery({
    query: {
      clickhouse: unsupported('Security policies'),
      mssql: (db) =>
        sql`
          CREATE SECURITY POLICY ${securityPolicyOf(target)}
          ${sql.join(predicates.map(securityPredicate.add))}
          WITH (STATE = ON)
        `.execute(db),
      mysql: unsupported('Security policies'),
      postgres: unsupported('Security policies'),
    },
  })
