import { queryOptions } from '@tanstack/react-query'
import { type } from 'arktype'
import type { Kysely, RawBuilder } from 'kysely'
import { sql } from 'kysely'

import type { Connection } from '~/entities/connection/core/sync'

import { connectionToQueryParams, createQuery } from '../../runtime/query'

const connectionVersionType = type({
  version: 'string',
}).pipe((data) => data.version)

const readVersion =
  (expression: RawBuilder<string>) =>
  // oxlint-disable-next-line ts/no-explicit-any
  async (db: Kysely<any>) => {
    const row = await db
      .selectNoFrom(expression.as('version'))
      .executeTakeFirst()

    if (!row) {
      throw new Error('Failed to read database version')
    }

    return row
  }

const connectionVersionQuery = createQuery({
  query: {
    clickhouse: readVersion(sql`version()`),
    mssql: readVersion(sql`SERVERPROPERTY('ProductVersion')`),
    mysql: readVersion(sql`VERSION()`),
    postgres: readVersion(sql`current_setting('server_version')`),
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
