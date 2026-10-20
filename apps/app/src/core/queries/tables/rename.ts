import { Dialect } from '@tamery/shared/enums/connection-type'
import { sql } from 'kysely'
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
          db.executeQuery(renameTableStatement(Dialect.ClickHouse, db, target)),
        // DuckDB renames a view only through ALTER VIEW.
        duckdb: async (db) => {
          const view = await db
            .selectFrom('duckdb_views')
            .select('view_name')
            .where('database_name', '=', sql<string>`current_database()`)
            .where('schema_name', '=', schema)
            .where('view_name', '=', oldTable)
            .executeTakeFirst()
          return view
            ? sql`ALTER VIEW ${sql.id(schema, oldTable)} RENAME TO ${sql.id(newTable)}`.execute(
                db
              )
            : db.executeQuery(renameTableStatement(Dialect.DuckDB, db, target))
        },
        mssql: (db) =>
          db.executeQuery(renameTableStatement(Dialect.MSSQL, db, target)),
        mysql: (db) =>
          db.executeQuery(renameTableStatement(Dialect.MySQL, db, target)),
        postgres: (db) =>
          db.executeQuery(renameTableStatement(Dialect.Postgres, db, target)),
        sqlite: (db) =>
          db.executeQuery(renameTableStatement(Dialect.SQLite, db, target)),
      },
    })
  }
)
