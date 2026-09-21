import { unsupported } from '@tamery/shared/utils/unsupported'
import { sql } from 'kysely'

import { createQuery } from '../../runtime/query'
import type { PolicyShape } from './shape'
import { policyClause } from './shape'

export const recreatePolicyQuery = ({
  name,
  schema,
  shape,
  table,
}: {
  name: string
  schema: string
  shape: PolicyShape
  table: string
}) =>
  createQuery({
    query: {
      clickhouse: unsupported('Editing row policies'),
      mssql: unsupported('Editing security policies'),
      mysql: unsupported('Editing privileges'),
      postgres: (db) =>
        db.transaction().execute(async (tx) => {
          await sql`DROP POLICY ${sql.id(name)} ON ${sql.id(schema, table)}`.execute(
            tx
          )
          await policyClause({ schema, shape, table }).execute(tx)
        }),
    },
  })
