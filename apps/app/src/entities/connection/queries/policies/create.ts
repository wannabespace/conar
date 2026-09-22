import { statementQuery } from '../shared/statements'
import type { PolicyShape } from './shape'
import { policyClause } from './shape'

export const createPolicyQuery = ({
  schema,
  shape,
  table,
}: {
  schema: string
  shape: PolicyShape
  table: string
}) =>
  statementQuery('Row policies', {
    postgres: policyClause({ schema, shape, table }),
  })
