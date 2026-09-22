import { unsupported } from '@tamery/shared/utils/unsupported'
import { sql } from 'kysely'

import { createQuery } from '../../runtime/query'
import type { PolicyTarget } from './shape'
import { policyOn } from './shape'

export const dropPolicyQuery = (target: PolicyTarget) =>
  createQuery({
    query: {
      clickhouse: (db) => sql`DROP ROW POLICY ${policyOn(target)}`.execute(db),
      mssql: unsupported('Row policies'),
      mysql: unsupported('Row policies'),
      postgres: (db) => sql`DROP POLICY ${policyOn(target)}`.execute(db),
    },
  })
