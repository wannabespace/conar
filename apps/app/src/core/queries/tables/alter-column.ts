import { ConnectionType } from '@tamery/shared/enums/connection-type'

import { createQuery } from '~/core/runtime/query'

import { alterColumnStatement } from './alter-column-statement'
import type { AlterColumnTarget } from './shape'

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
