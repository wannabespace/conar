import { unsupported } from '@tamery/shared/utils/unsupported'

import { createQuery } from '../../runtime/query'
import type { IndexShape } from './shape'
import { createIndexStatement } from './shape'

export const createIndexQuery = (shape: IndexShape) => {
  const create = createIndexStatement(shape)

  return createQuery({
    query: {
      clickhouse: unsupported('Creating indexes'),
      mssql: (db) => create.execute(db),
      mysql: (db) => create.execute(db),
      postgres: (db) => create.execute(db),
    },
  })
}
