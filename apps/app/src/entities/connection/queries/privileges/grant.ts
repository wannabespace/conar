import { unsupported } from '@tamery/shared/unsupported'
import { sql } from 'kysely'

import { createQuery } from '../../runtime/query'
import type { PrivilegeTarget } from './shape'
import { accountOf, privilegeOn } from './shape'

export const grantPrivilegeQuery = (target: PrivilegeTarget) =>
  createQuery({
    query: {
      clickhouse: unsupported('Privileges'),
      mssql: unsupported('Privileges'),
      mysql: (db) =>
        sql`GRANT ${privilegeOn(target)} TO ${accountOf(target.grantee)}${target.grantable ? sql` WITH GRANT OPTION` : sql``}`.execute(
          db
        ),
      postgres: unsupported('Privileges'),
    },
  })
