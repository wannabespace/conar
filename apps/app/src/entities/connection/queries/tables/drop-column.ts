import { createQuery } from '../../runtime/query'
import { dropColumnStatement } from './shape'

export const dropColumnQuery = (target: {
  column: string
  schema: string
  table: string
}) =>
  createQuery({
    query: {
      clickhouse: (db) => db.executeQuery(dropColumnStatement(db, target)),
      mssql: (db) => db.executeQuery(dropColumnStatement(db, target)),
      mysql: (db) => db.executeQuery(dropColumnStatement(db, target)),
      postgres: (db) => db.executeQuery(dropColumnStatement(db, target)),
    },
  })
