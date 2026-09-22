import { unsupported } from '@tamery/shared/unsupported'

import { createQuery } from '../../runtime/query'
import type { FunctionShape } from './shape'
import { createFunctionStatements } from './shape'

export const createFunctionQuery = ({
  schema,
  shape,
}: {
  schema: string
  shape: FunctionShape
}) => {
  const create = createFunctionStatements({ replace: false, schema, shape })

  return createQuery({
    query: {
      clickhouse: unsupported('Functions'),
      mssql: (db) => create.mssql.execute(db),
      mysql: (db) => create.mysql.execute(db),
      postgres: (db) => create.postgres.execute(db),
    },
  })
}
