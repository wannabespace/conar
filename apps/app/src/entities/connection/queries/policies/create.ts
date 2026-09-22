import { unsupported } from '@tamery/shared/unsupported'

import { createQuery } from '../../runtime/query'
import type { PolicyShape } from './shape'
import { createPolicyStatement, createRowPolicyStatement } from './shape'

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
      clickhouse: (db) =>
        createRowPolicyStatement({ schema, shape, table }).execute(db),
      mssql: unsupported('Row policies'),
      mysql: unsupported('Row policies'),
      postgres: (db) =>
        createPolicyStatement({ schema, shape, table }).execute(db),
    },
  })
