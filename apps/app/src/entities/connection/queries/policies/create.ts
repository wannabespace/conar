import { createQuery } from '../../runtime/query'
import { unsupported } from '../shared/unsupported'
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
  createQuery({
    query: {
      clickhouse: unsupported('Creating row policies'),
      mssql: unsupported('Creating security policies'),
      mysql: unsupported('Creating privileges'),
      postgres: (db) => policyClause({ schema, shape, table }).execute(db),
    },
  })
