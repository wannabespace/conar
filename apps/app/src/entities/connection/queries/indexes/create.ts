import { createQuery } from '../../runtime/query'
import type { IndexShape } from './shape'
import {
  addSkipIndexStatement,
  createIndexStatement,
  materializeIndexStatement,
} from './shape'

export const createIndexQuery = (shape: IndexShape) => {
  const create = createIndexStatement(shape)

  return createQuery({
    query: {
      clickhouse: async (db) => {
        await addSkipIndexStatement(shape).execute(db)
        await materializeIndexStatement(shape).execute(db)
      },
      mssql: (db) => create.execute(db),
      mysql: (db) => create.execute(db),
      postgres: (db) => create.execute(db),
    },
  })
}
