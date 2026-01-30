import { type } from 'arktype'
import { sql } from 'kysely'
import { createQuery } from '../query'

export const connectionVersionType = type({
  version: 'string',
}).pipe(data => data.version)

export const connectionVersionQuery = createQuery({
  type: connectionVersionType,
  query: () => ({
    // Note: Postgres and MySQL store version in system tables, allowing direct column selection.
    // MSSQL and ClickHouse expose version via functions, requiring expression builder calls.

    // Reliable for all PostgreSQL versions
    postgres: async (db) => {
      try {
        return await db
          .selectFrom('pg_catalog.pg_settings')
          .select('setting as version')
          .where('name', '=', 'server_version')
          .executeTakeFirstOrThrow()
      }
      catch {
        // fallback to raw sql that works with all versions
        return (await sql<{ version: string }>`SELECT current_setting('server_version') as version`.execute(db)).rows[0]!
      }
    },

    mysql: async (db) => {
      try {
        // for mysql >= v8.0
        return await db
          .selectFrom('performance_schema.global_variables')
          .select('VARIABLE_VALUE as version')
          .where('VARIABLE_NAME', '=', 'version')
          .executeTakeFirstOrThrow()
      }
      catch {
        // Fallback using raw SQL which works on all versions
        return (await sql<{ version: string }>`SELECT VERSION() as version`.execute(db)).rows[0]!
      }
    },

    // MSSQL requires function call via builder (no system table column available)
    mssql: async (db) => {
      try {
        return await db
          .selectFrom('sys.databases')
          .select(eb => eb.fn<string>('SERVERPROPERTY', [eb.val('ProductVersion')]).as('version'))
          .orderBy('name')
          .limit(1)
          .executeTakeFirstOrThrow()
      }
      catch {
        // fallback to raw sql that works with all versions
        return (await sql<{ version: string }>`SELECT SERVERPROPERTY('ProductVersion') as version`.execute(db)).rows[0]!
      }
    },

    // ClickHouse requires function call via builder (system table unreliable)
    clickhouse: async (db) => {
      try {
        return await db
          .selectFrom('system.one')
          .select(eb => eb.fn<string>('version', []).as('version'))
          .executeTakeFirstOrThrow()
      }
      catch {
        // fallback to raw sql that works with all versions
        return (await sql<{ version: string }>`SELECT version() as version`.execute(db)).rows[0]!
      }
    },
  }),
})
