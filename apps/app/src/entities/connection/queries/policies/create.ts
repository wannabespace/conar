import { unsupported } from '@tamery/shared/utils/unsupported'

import { createQuery } from '../../runtime/query'
import type { PolicyShape } from './shape'
import { createPolicyStatement } from './shape'

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
      clickhouse: unsupported('Row policies'),
      mssql: unsupported('Row policies'),
      mysql: unsupported('Row policies'),
      postgres: (db) =>
        createPolicyStatement({ schema, shape, table }).execute(db),
    },
  })
