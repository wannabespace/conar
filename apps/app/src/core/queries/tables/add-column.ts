import { ConnectionType } from '@tamery/shared/enums/connection-type'

import { createQuery } from '~/core/runtime/query'

import type { NewColumn } from './shape'
import { addColumnStatement } from './shape'

export const addColumnQuery = (target: {
  column: NewColumn
  schema: string
  table: string
}) =>
  createQuery({
    query: {
      clickhouse: (db) =>
        db.executeQuery(
          addColumnStatement(ConnectionType.ClickHouse, db, target)
        ),
      mssql: (db) =>
        db.executeQuery(addColumnStatement(ConnectionType.MSSQL, db, target)),
      mysql: (db) =>
        db.executeQuery(addColumnStatement(ConnectionType.MySQL, db, target)),
      postgres: (db) =>
        db.executeQuery(
          addColumnStatement(ConnectionType.Postgres, db, target)
        ),
    },
  })
