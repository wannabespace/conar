import { unsupported } from '@tamery/shared/unsupported'
import { sql } from 'kysely'

import { createQuery } from '../../runtime/query'
import type { PolicyTarget } from './shape'
import { policyOn, securityPolicyOf } from './shape'

export const dropPolicyQuery = (target: PolicyTarget) =>
  createQuery({
    query: {
      clickhouse: (db) => sql`DROP ROW POLICY ${policyOn(target)}`.execute(db),
      mssql: (db) =>
        sql`DROP SECURITY POLICY ${securityPolicyOf(target)}`.execute(db),
      mysql: unsupported('Row policies'),
      postgres: (db) => sql`DROP POLICY ${policyOn(target)}`.execute(db),
    },
  })
