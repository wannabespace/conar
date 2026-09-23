import { unsupported } from '@tamery/shared/unsupported'
import { sql } from 'kysely'

import { createQuery } from '../../runtime/query'
import type { SecurityPolicyTarget } from './shape'
import { securityPolicyOf } from './shape'

export const setSecurityPolicyEnabledQuery = ({
  enabled,
  ...target
}: SecurityPolicyTarget & { enabled: boolean }) =>
  createQuery({
    query: {
      clickhouse: unsupported('Security policies'),
      mssql: (db) =>
        sql`ALTER SECURITY POLICY ${securityPolicyOf(target)} WITH (STATE = ${sql.raw(enabled ? 'ON' : 'OFF')})`.execute(
          db
        ),
      mysql: unsupported('Security policies'),
      postgres: unsupported('Security policies'),
    },
  })
