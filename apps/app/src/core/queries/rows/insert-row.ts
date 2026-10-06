import { createQuery } from '~/core/runtime/query'

import { insertRows } from './shape'

export const insertRowQuery = ({
  schema,
  table,
  values,
}: {
  schema: string
  table: string
  values: Record<string, unknown>
}) =>
  createQuery({
    query: {
      clickhouse: (db) => insertRows(db, { schema, table }, [values]),
      mssql: (db) => insertRows(db, { schema, table }, [values]),
      mysql: (db) => insertRows(db, { schema, table }, [values]),
      postgres: (db) => insertRows(db, { schema, table }, [values]),
    },
  })
