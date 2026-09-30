import { ConnectionType } from '@tamery/shared/enums/connection-type'

import { createQuery } from '../../runtime/query'
import type { ConstraintKind, ConstraintTarget } from './shape'
import { dropConstraintStatement } from './shape'

export const dropConstraintQuery = (
  target: ConstraintTarget & { cascade: boolean; kind: ConstraintKind }
) =>
  createQuery({
    query: {
      clickhouse: (db) =>
        db.executeQuery(
          dropConstraintStatement(ConnectionType.ClickHouse, db, target)
        ),
      mssql: (db) =>
        db.executeQuery(
          dropConstraintStatement(ConnectionType.MSSQL, db, target)
        ),
      mysql: (db) =>
        db.executeQuery(
          dropConstraintStatement(ConnectionType.MySQL, db, target)
        ),
      postgres: (db) =>
        db.executeQuery(
          dropConstraintStatement(ConnectionType.Postgres, db, target)
        ),
    },
  })
