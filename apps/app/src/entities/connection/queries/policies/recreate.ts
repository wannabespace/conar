import { sql } from 'kysely'

import { statementQuery } from '../shared/statements'
import type { PolicyShape, PolicyTarget } from './shape'
import { policyClause, policyOn } from './shape'

export const recreatePolicyQuery = ({
  shape,
  ...target
}: PolicyTarget & { shape: PolicyShape }) =>
  statementQuery('Row policies', {
    postgres: [
      sql`DROP POLICY ${policyOn(target)}`,
      policyClause({ schema: target.schema, shape, table: target.table }),
    ],
  })
