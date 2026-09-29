import { ConnectionType } from '@tamery/shared/enums/connection-type'

import { createQuery } from '../../runtime/query'
import { alterColumnStatement } from './shape'

export const alterColumnQuery = (target: {
  column: string
  nullable: boolean
  schema: string
  table: string
  type: string
}) =>
  createQuery({
    query: {
      clickhouse: (db) =>
        db.executeQuery(
          alterColumnStatement(ConnectionType.ClickHouse, db, target)
        ),
      mssql: (db) =>
        db.executeQuery(alterColumnStatement(ConnectionType.MSSQL, db, target)),
      mysql: (db) =>
        db.executeQuery(alterColumnStatement(ConnectionType.MySQL, db, target)),
      postgres: (db) =>
        db.executeQuery(
          alterColumnStatement(ConnectionType.Postgres, db, target)
        ),
    },
  })
