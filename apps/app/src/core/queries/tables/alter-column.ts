import { Dialect } from '@tamery/shared/enums/connection-type'

import { createQuery } from '~/core/runtime/query'

import type { AlterColumnTarget } from './shape'
import { alterColumnStatement } from './shape/alter-column'

export const alterColumnQuery = (target: AlterColumnTarget) =>
  createQuery({
    query: {
      clickhouse: (db) =>
        db.executeQuery(alterColumnStatement(Dialect.ClickHouse, db, target)),
      mssql: (db) =>
        db.executeQuery(alterColumnStatement(Dialect.MSSQL, db, target)),
      mysql: (db) =>
        db.executeQuery(alterColumnStatement(Dialect.MySQL, db, target)),
      postgres: (db) =>
        db.executeQuery(alterColumnStatement(Dialect.Postgres, db, target)),
    },
  })
