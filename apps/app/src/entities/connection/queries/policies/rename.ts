import { unsupported } from '@tamery/shared/unsupported'
import { sql } from 'kysely'

import { createQuery } from '../../runtime/query'
import type { PolicyTarget } from './shape'
import { policyOn } from './shape'

export const renamePolicyQuery = ({
  newName,
  ...target
}: PolicyTarget & { newName: string }) =>
  createQuery({
    query: {
      clickhouse: (db) =>
        sql`ALTER ROW POLICY ${policyOn(target)} RENAME TO ${sql.id(newName)}`.execute(
          db
        ),
      mssql: unsupported('Row policies'),
      mysql: unsupported('Row policies'),
      postgres: (db) =>
        sql`ALTER POLICY ${policyOn(target)} RENAME TO ${sql.id(newName)}`.execute(
          db
        ),
    },
  })
