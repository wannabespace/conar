import { unsupported } from '@tamery/shared/utils/unsupported'
import type { Kysely } from 'kysely'
import { sql } from 'kysely'

import { createQuery } from '../../runtime/query'

export const createFunctionQuery = ({ create }: { create: string }) => {
  // oxlint-disable-next-line ts/no-explicit-any
  const statement = (db: Kysely<any>) => sql.raw(create).execute(db)

  return createQuery({
    query: {
      clickhouse: unsupported('Functions'),
      mssql: statement,
      mysql: statement,
      postgres: statement,
    },
  })
}
