import { unsupported } from '@tamery/shared/unsupported'

import { createQuery } from '../../runtime/query'
import type { TriggerShape, TriggerTarget } from './shape'
import { createTriggerStatements } from './shape'

export const createTriggerQuery = (
  params: TriggerTarget & { shape: TriggerShape }
) => {
  const create = createTriggerStatements(params)

  return createQuery({
    query: {
      clickhouse: unsupported('Triggers'),
      mssql: (db) => create.mssql.execute(db),
      mysql: (db) => create.mysql.execute(db),
      postgres: (db) => create.postgres.execute(db),
    },
  })
}
