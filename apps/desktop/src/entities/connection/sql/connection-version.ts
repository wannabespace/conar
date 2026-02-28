import { type } from 'arktype'
import { sql } from 'kysely'
import { createQuery } from '../query'

export const connectionVersionType = type({
  version: 'string',
}).pipe(data => data.version)

export const connectionVersionQuery = createQuery({
  type: connectionVersionType,
  silent: true,
  // Each query has a fallback to get a version in older versions
  query: () => ({
    postgres: async (db) => {
      try {
        return await db
          .selectFrom('pg_catalog.pg_settings')
          .select('setting as version')
          .where('name', '=', 'server_version')
          .executeTakeFirstOrThrow()
      }
      catch {
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
        return (await sql<{ version: string }>`SELECT VERSION() as version`.execute(db)).rows[0]!
      }
    },
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
        return (await sql<{ version: string }>`SELECT SERVERPROPERTY('ProductVersion') as version`.execute(db)).rows[0]!
      }
    },
    clickhouse: async (db) => {
      try {
        return await db
          .selectFrom('system.one')
          .select(eb => eb.fn<string>('version', []).as('version'))
          .executeTakeFirstOrThrow()
      }
      catch {
        return (await sql<{ version: string }>`SELECT version() as version`.execute(db)).rows[0]!
      }
    },
    sqlite: async (db) => {
      const { rows } = await sql<{ version: string }>`SELECT sqlite_version() as version`.execute(db)
      return rows[0]!
    },
  }),
})
