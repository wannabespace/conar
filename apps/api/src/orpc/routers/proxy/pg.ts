import type { DatabaseQueryResult } from '@conar/shared/databases'
import type { QueryResult } from 'pg'
import { parseConnectionString } from '@conar/connection'
import { readSSLFiles } from '@conar/connection/server'
import { type } from 'arktype'
import pg from 'pg'
import { authMiddleware, orpc } from '~/orpc'

const parseDate = (value: string) => value

pg.types.setTypeParser(pg.types.builtins.DATE, parseDate)
pg.types.setTypeParser(pg.types.builtins.TIMESTAMP, parseDate)
pg.types.setTypeParser(pg.types.builtins.TIMESTAMPTZ, parseDate)
pg.types.setTypeParser(pg.types.builtins.TIME, parseDate)
pg.types.setTypeParser(pg.types.builtins.TIMETZ, parseDate)

export const pgProxy = orpc
  .use(authMiddleware)
  .input(type({
    'connectionString': 'string',
    'query': 'string',
    'values?': 'unknown[]',
  }))
  .handler(async ({ input }): Promise<DatabaseQueryResult[]> => {
    const config = parseConnectionString(input.connectionString)
    const client = new pg.Client({
      ...config,
      ...(config.ssl ? { ssl: readSSLFiles(config.ssl) } : {}),
    })

    try {
      await client.connect()
      const result = await client.query(input.query, input.values)
      const array = (Array.isArray(result) ? result : [result]) as QueryResult[]

      return array.map(r => ({
        count: r.rowCount ?? 0,
        columns: r.fields.map(f => ({
          id: f.name,
        })),
        rows: r.rows,
      }))
    }
    finally {
      await client.end()
    }
  })

export const pgTestConnection = orpc
  .use(authMiddleware)
  .input(type({
    connectionString: 'string',
  }))
  .handler(async ({ input }): Promise<boolean> => {
    const config = parseConnectionString(input.connectionString)
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
  })
