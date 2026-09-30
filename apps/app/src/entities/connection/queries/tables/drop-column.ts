import { ConnectionType } from '@tamery/shared/enums/connection-type'

import { createQuery } from '../../runtime/query'
import { dropColumnStatement } from './shape'

export const dropColumnQuery = (target: {
  column: string
  schema: string
  table: string
}) =>
  createQuery({
    query: {
      clickhouse: (db) =>
        db.executeQuery(
          dropColumnStatement(ConnectionType.ClickHouse, db, target)
        ),
      mssql: (db) =>
        db.executeQuery(dropColumnStatement(ConnectionType.MSSQL, db, target)),
      mysql: (db) =>
        db.executeQuery(dropColumnStatement(ConnectionType.MySQL, db, target)),
      postgres: (db) =>
        db.executeQuery(
          dropColumnStatement(ConnectionType.Postgres, db, target)
        ),
    },
  })
