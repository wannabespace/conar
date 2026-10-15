import { SqlDialect } from '@tamery/shared/enums/connection-type'

import { createQuery } from '~/core/runtime/query'

import type { AlterColumnTarget } from './shape'
import { alterColumnStatement } from './shape/alter-column'

export const alterColumnQuery = (target: AlterColumnTarget) =>
  createQuery({
    query: {
      clickhouse: (db) =>
        db.executeQuery(
          alterColumnStatement(SqlDialect.ClickHouse, db, target)
        ),
      mssql: (db) =>
        db.executeQuery(alterColumnStatement(SqlDialect.MSSQL, db, target)),
      mysql: (db) =>
        db.executeQuery(alterColumnStatement(SqlDialect.MySQL, db, target)),
      postgres: (db) =>
        db.executeQuery(alterColumnStatement(SqlDialect.Postgres, db, target)),
    },
  })
