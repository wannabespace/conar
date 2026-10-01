import { ConnectionType } from '@tamery/shared/enums/connection-type'

import { createQuery } from '~/core/runtime/query'

import type { NewColumn } from './shape'
import { createTableStatement } from './shape'

export const createTableQuery = (target: {
  columns: NewColumn[]
  schema: string
  table: string
}) =>
  createQuery({
    query: {
      clickhouse: (db) =>
        db.executeQuery(
          createTableStatement(ConnectionType.ClickHouse, db, target)
        ),
      mssql: (db) =>
        db.executeQuery(createTableStatement(ConnectionType.MSSQL, db, target)),
      mysql: (db) =>
        db.executeQuery(createTableStatement(ConnectionType.MySQL, db, target)),
      postgres: (db) =>
        db.executeQuery(
          createTableStatement(ConnectionType.Postgres, db, target)
        ),
    },
  })
