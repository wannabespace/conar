import { queryOptions } from '@tanstack/react-query'
import { type } from 'arktype'
import { sql } from 'kysely'

import type { Connection } from '~/entities/connection/core'

import { connectionToQueryParams, createQuery } from '../runtime/query'

export const connectionVersionType = type({
  version: 'string',
}).pipe((data) => data.version)

const firstVersionRow = async (
  result: Promise<{ rows: { version: string }[] }>
) => {
  const { rows } = await result
  const [row] = rows
  if (!row) {
    throw new Error('Failed to read database version')
  }
  return row
}

export const connectionVersionQuery = createQuery({
  query: {
    clickhouse: async (db) => {
      try {
        return await db
          .selectFrom('system.one')
          .select((eb) => eb.fn<string>('version', []).as('version'))
          .executeTakeFirstOrThrow()
      } catch {
        return firstVersionRow(
          sql<{ version: string }>`SELECT version() as version`.execute(db)
        )
      }
    },
    mssql: async (db) => {
      try {
        return await db
          .selectFrom('sys.databases')
          .select((eb) =>
            eb
              .fn<string>('SERVERPROPERTY', [eb.val('ProductVersion')])
              .as('version')
          )
          .orderBy('name')
          .limit(1)
          .executeTakeFirstOrThrow()
      } catch {
        return firstVersionRow(
          sql<{
            version: string
          }>`SELECT SERVERPROPERTY('ProductVersion') as version`.execute(db)
        )
      }
    },
    mysql: async (db) => {
      try {
        return await db
          .selectFrom('performance_schema.global_variables')
          .select('VARIABLE_VALUE as version')
          .where('VARIABLE_NAME', '=', 'version')
          .executeTakeFirstOrThrow()
      } catch {
        return firstVersionRow(
          sql<{ version: string }>`SELECT VERSION() as version`.execute(db)
        )
      }
    },
    postgres: async (db) => {
      try {
        return await db
          .selectFrom('pg_catalog.pg_settings')
          .select('setting as version')
          .where('name', '=', 'server_version')
          .executeTakeFirstOrThrow()
      } catch {
        return firstVersionRow(
          sql<{
            version: string
          }>`SELECT current_setting('server_version') as version`.execute(db)
        )
      }
    },
  },
  type: connectionVersionType,
})

export const connectionVersionQueryOptions = (connection: Connection) =>
  queryOptions({
    queryFn: async () =>
      connectionVersionQuery.run(await connectionToQueryParams(connection)),
    queryKey: ['connection-resource', connection.id, 'version'],
    throwOnError: false,
  })
