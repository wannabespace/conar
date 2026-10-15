import { SqlDialect } from '@tamery/shared/enums/connection-type'
import { memoize } from 'memoza'

import { createQuery } from '~/core/runtime/query'

import { dropTableStatement } from './shape'

export const dropTableQuery = memoize(
  (target: { table: string; schema: string; cascade: boolean }) =>
    createQuery({
      query: {
        clickhouse: (db) =>
          db.executeQuery(
            dropTableStatement(SqlDialect.ClickHouse, db, target)
          ),
        mssql: (db) =>
          db.executeQuery(dropTableStatement(SqlDialect.MSSQL, db, target)),
        mysql: (db) =>
          db.executeQuery(dropTableStatement(SqlDialect.MySQL, db, target)),
        postgres: (db) =>
          db.executeQuery(dropTableStatement(SqlDialect.Postgres, db, target)),
      },
    })
)
