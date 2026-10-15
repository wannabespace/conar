import { SqlDialect } from '@tamery/shared/enums/connection-type'

import { createQuery } from '~/core/runtime/query'

import { dropColumnStatement } from './shape'

export const dropColumnQuery = (target: {
  column: string
  schema: string
  table: string
}) =>
  createQuery({
    query: {
      clickhouse: (db) =>
        db.executeQuery(dropColumnStatement(SqlDialect.ClickHouse, db, target)),
      mssql: (db) =>
        db.executeQuery(dropColumnStatement(SqlDialect.MSSQL, db, target)),
      mysql: (db) =>
        db.executeQuery(dropColumnStatement(SqlDialect.MySQL, db, target)),
      postgres: (db) =>
        db.executeQuery(dropColumnStatement(SqlDialect.Postgres, db, target)),
    },
  })
