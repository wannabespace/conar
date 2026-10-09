import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { memoize } from 'memoza'

import { createQuery } from '~/core/runtime/query'

import { renameColumnStatement } from './shape'

export const renameColumnQuery = memoize(
  ({
    schema,
    table,
    oldColumn,
    newColumn,
  }: {
    schema: string
    table: string
    oldColumn: string
    newColumn: string
  }) => {
    const target = { column: oldColumn, newName: newColumn, schema, table }

    return createQuery({
      query: {
        clickhouse: (db) =>
          db.executeQuery(
            renameColumnStatement(ConnectionType.ClickHouse, db, target)
          ),
        mssql: (db) =>
          db.executeQuery(
            renameColumnStatement(ConnectionType.MSSQL, db, target)
          ),
        mysql: (db) =>
          db.executeQuery(
            renameColumnStatement(ConnectionType.MySQL, db, target)
          ),
        postgres: (db) =>
          db.executeQuery(
            renameColumnStatement(ConnectionType.Postgres, db, target)
          ),
      },
    })
  }
)
