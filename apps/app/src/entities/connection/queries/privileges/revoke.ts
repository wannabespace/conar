import { unsupported } from '@tamery/shared/unsupported'
import { sql } from 'kysely'

import { createQuery } from '../../runtime/query'
import type { PrivilegeTarget } from './shape'
import { accountOf, privilegeOn } from './shape'

export const revokePrivilegeQuery = (target: PrivilegeTarget) =>
  createQuery({
    query: {
      clickhouse: unsupported('Privileges'),
      mssql: unsupported('Privileges'),
      mysql: (db) =>
        sql`REVOKE ${privilegeOn(target)} FROM ${accountOf(target.grantee)}`.execute(
          db
        ),
      postgres: unsupported('Privileges'),
    },
  })
