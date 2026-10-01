import { ConnectionType } from '@tamery/shared/enums/connection-type'

import { createQuery } from '~/core/runtime/query'

import type { AlterColumnTarget } from './shape'
import { alterColumnStatement } from './shape'

export const alterColumnQuery = (target: AlterColumnTarget) =>
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
