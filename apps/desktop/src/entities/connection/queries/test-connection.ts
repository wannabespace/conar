import { sql } from 'kysely'
import { createQuery } from '../query'

export const testConnectionQuery = createQuery({
  query: {
    postgres: db => db.executeQuery(sql`SELECT 1`.compile(db)),
    mysql: db => db.executeQuery(sql`SELECT 1`.compile(db)),
    mssql: db => db.executeQuery(sql`SELECT 1`.compile(db)),
    clickhouse: db => db.executeQuery(sql`SELECT 1`.compile(db)),
    sqlite: db => db.executeQuery(sql`SELECT 1`.compile(db)),
  },
})
