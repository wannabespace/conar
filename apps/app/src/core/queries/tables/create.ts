import { SqlDialect } from '@tamery/shared/enums/connection-type'

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
          createTableStatement(SqlDialect.ClickHouse, db, target)
        ),
      mssql: (db) =>
        db.executeQuery(createTableStatement(SqlDialect.MSSQL, db, target)),
      mysql: (db) =>
        db.executeQuery(createTableStatement(SqlDialect.MySQL, db, target)),
      postgres: (db) =>
        db.executeQuery(createTableStatement(SqlDialect.Postgres, db, target)),
    },
  })
