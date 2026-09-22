import { sql } from 'kysely'

import { statementQuery } from '../shared/statements'
import type { PolicyTarget } from './shape'
import { policyOn } from './shape'

export const dropPolicyQuery = (target: PolicyTarget) =>
  statementQuery('Row policies', {
    clickhouse: sql`DROP ROW POLICY ${policyOn(target)}`,
    postgres: sql`DROP POLICY ${policyOn(target)}`,
  })
