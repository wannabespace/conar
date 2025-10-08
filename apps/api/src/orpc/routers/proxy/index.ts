import type { DatabaseQueryResult } from '@conar/shared/databases'
import type { QueryParams } from '@conar/shared/filters/sql'
import process from 'node:process'
import { parseConnectionString } from '@conar/connection'
import { readSSLFiles } from '@conar/connection/server'
import { DatabaseType } from '@conar/shared/enums/database-type'
import { type } from 'arktype'
import pg from 'pg'
import { authMiddleware, orpc } from '~/orpc'

const parseDate = (value: string) => value

pg.types.setTypeParser(pg.types.builtins.DATE, parseDate)
pg.types.setTypeParser(pg.types.builtins.TIMESTAMP, parseDate)
pg.types.setTypeParser(pg.types.builtins.TIMESTAMPTZ, parseDate)
pg.types.setTypeParser(pg.types.builtins.TIME, parseDate)
pg.types.setTypeParser(pg.types.builtins.TIMETZ, parseDate)

const poolMap: Map<string, InstanceType<typeof pg.Pool>> = new Map()

process.on('SIGINT', async () => {
  poolMap.forEach(pool => pool.end())
})

process.on('SIGTERM', async () => {
  poolMap.forEach(pool => pool.end())
})

async function pgQuery({
  connectionString,
  method,
  sql,
  params,
}: QueryParams) {
  const config = parseConnectionString(connectionString)

  const existingPool = poolMap.get(connectionString)

  const pool = existingPool || new pg.Pool({
    ...config,
    ...(config.ssl ? { ssl: readSSLFiles(config.ssl) } : {}),
  })

  if (!existingPool) {
    poolMap.set(connectionString, pool)
  }

  const result = await (method === 'all'
    ? pool.query({
        text: sql,
        values: params,
        rowMode: 'array',
      })
    : pool.query(sql, params))

  return { rows: result.rows }
}

const queryMap = {
  [DatabaseType.Postgres]: pgQuery,
} satisfies Record<DatabaseType, (params: QueryParams) => Promise<DatabaseQueryResult>>

const proxyQuery = orpc
  .use(authMiddleware)
  .input(type({
    'type': type.valueOf(DatabaseType),
    'connectionString': 'string',
    'sql': 'string',
    'params?': 'unknown[]',
    'method': '"all" | "execute"',
  }))
  .handler(async ({ input }): Promise<DatabaseQueryResult> => {
    try {
      return await queryMap[input.type]({
        connectionString: input.connectionString,
        sql: input.sql,
        params: input.params,
        method: input.method,
      })
    }
    catch (error) {
      if (error instanceof AggregateError) {
        throw error.errors[0]
      }

      throw error
    }
  })

async function pgTestConnection(connectionString: string) {
  const config = parseConnectionString(connectionString)
  const client = new pg.Client({
    ...config,
    ...(config.ssl ? { ssl: readSSLFiles(config.ssl) } : {}),
  })

  try {
    await client.connect()

    return true
  }
  finally {
    await client.end()
  }
}

const testMap = {
  [DatabaseType.Postgres]: pgTestConnection,
} satisfies Record<DatabaseType, (connectionString: string) => Promise<boolean>>

const proxyTestConnection = orpc
  .use(authMiddleware)
  .input(type({
    type: type.valueOf(DatabaseType),
    connectionString: 'string',
  }))
  .handler(async ({ input }): Promise<boolean> => testMap[input.type](input.connectionString))

export const proxy = {
  databases: {
    query: proxyQuery,
    test: proxyTestConnection,
  },
}
