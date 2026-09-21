import { unsupported } from '@tamery/shared/utils/unsupported'

import { createQuery } from '../../runtime/query'
import type { TriggerTarget } from './shape'
import { dropTriggerStatements } from './shape'

export const dropTriggerQuery = (params: TriggerTarget & { name: string }) => {
  const drop = dropTriggerStatements(params)

  return createQuery({
    query: {
      clickhouse: unsupported('Triggers'),
      mssql: (db) => drop.mssql.execute(db),
      mysql: (db) => drop.mysql.execute(db),
      postgres: (db) => drop.postgres.execute(db),
    },
  })
}
