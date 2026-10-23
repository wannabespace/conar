import type { Kysely } from 'kysely'
import { sql } from 'kysely'

import type { Database as OracleDatabase } from '~/core/runtime/dialects/oracle/schema'

/** Every account Oracle does not maintain, plus the session's own schema: SYSTEM's is Oracle-maintained, yet a SYSTEM login works there. */
export const userSchemas = (db: Kysely<OracleDatabase>) =>
  db
    .selectFrom('ALL_USERS')
    .select('USERNAME')
    .where((eb) =>
      eb.or([
        eb('ORACLE_MAINTAINED', '=', 'N'),
        eb(
          'USERNAME',
          '=',
          sql<string>`SYS_CONTEXT('USERENV', 'CURRENT_SCHEMA')`
        ),
      ])
    )
