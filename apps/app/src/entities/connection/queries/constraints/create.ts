import { ConnectionType } from '@tamery/shared/enums/connection-type'

import { createQuery } from '../../runtime/query'
import type { ConstraintShape } from './shape'
import { addConstraintStatement } from './shape'

export const createConstraintQuery = ({
  schema,
  shape,
  table,
}: {
  schema: string
  shape: ConstraintShape
  table: string
}) => {
  const target = { schema, table }

  return createQuery({
    query: {
      clickhouse: (db) =>
        db.executeQuery(
          addConstraintStatement(ConnectionType.ClickHouse, db, target, shape)
        ),
      mssql: (db) =>
        db.executeQuery(
          addConstraintStatement(ConnectionType.MSSQL, db, target, shape)
        ),
      mysql: (db) =>
        db.executeQuery(
          addConstraintStatement(ConnectionType.MySQL, db, target, shape)
        ),
      postgres: (db) =>
        db.executeQuery(
          addConstraintStatement(ConnectionType.Postgres, db, target, shape)
        ),
    },
  })
}
