import { unsupported } from '@tamery/shared/unsupported'
import { sql } from 'kysely'

import { createQuery } from '../../runtime/query'
import type { PolicyShape } from './shape'
import {
  createPolicyStatement,
  createRowPolicyStatement,
  policyPredicate,
} from './shape'

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
      mssql: (db) =>
        sql`
          CREATE SECURITY POLICY ${sql.id(schema, shape.name)}
          ${sql.join(shape.predicates.map(policyPredicate.add))}
          WITH (STATE = ON)
        `.execute(db),
      mysql: unsupported('Row policies'),
      postgres: (db) =>
        createPolicyStatement({ schema, shape, table }).execute(db),
    },
  })
