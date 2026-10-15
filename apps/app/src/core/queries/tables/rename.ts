import { SqlDialect } from '@tamery/shared/enums/connection-type'
import { memoize } from 'memoza'

import { createQuery } from '~/core/runtime/query'

import { renameTableStatement } from './shape'

export const renameTableQuery = memoize(
  ({
    schema,
    oldTable,
    newTable,
  }: {
    schema: string
    oldTable: string
    newTable: string
  }) => {
    const target = { newName: newTable, schema, table: oldTable }

    return createQuery({
      query: {
        clickhouse: (db) =>
          db.executeQuery(
            renameTableStatement(SqlDialect.ClickHouse, db, target)
          ),
        mssql: (db) =>
          db.executeQuery(renameTableStatement(SqlDialect.MSSQL, db, target)),
        mysql: (db) =>
          db.executeQuery(renameTableStatement(SqlDialect.MySQL, db, target)),
        postgres: (db) =>
          db.executeQuery(
            renameTableStatement(SqlDialect.Postgres, db, target)
          ),
      },
    })
  }
)
