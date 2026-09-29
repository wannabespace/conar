import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { memoize } from 'memoza'

import { createQuery } from '../../runtime/query'
import { dropTableStatement } from './shape'

export const dropTableQuery = memoize(
  (target: { table: string; schema: string; cascade: boolean }) =>
    createQuery({
      query: {
        clickhouse: (db) =>
          db.executeQuery(
            dropTableStatement(ConnectionType.ClickHouse, db, target)
          ),
        mssql: (db) =>
          db.executeQuery(dropTableStatement(ConnectionType.MSSQL, db, target)),
        mysql: (db) =>
          db.executeQuery(dropTableStatement(ConnectionType.MySQL, db, target)),
        postgres: (db) =>
          db.executeQuery(
            dropTableStatement(ConnectionType.Postgres, db, target)
          ),
      },
    })
)
