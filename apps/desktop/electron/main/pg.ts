import type { DatabaseQueryResult } from '@conar/shared/databases'
import type { QueryParams } from '@conar/shared/filters/sql'
import { createRequire } from 'node:module'
import { parseConnectionString } from '@conar/connection'
import { readSSLFiles } from '@conar/connection/server'
import { app } from 'electron'

const pg = createRequire(import.meta.url)('pg') as typeof import('pg')

const parseDate = (value: string) => value

pg.types.setTypeParser(pg.types.builtins.DATE, parseDate)
pg.types.setTypeParser(pg.types.builtins.TIMESTAMP, parseDate)
pg.types.setTypeParser(pg.types.builtins.TIMESTAMPTZ, parseDate)
pg.types.setTypeParser(pg.types.builtins.TIME, parseDate)
pg.types.setTypeParser(pg.types.builtins.TIMETZ, parseDate)

const poolMap: Map<string, InstanceType<typeof pg.Pool>> = new Map()

app.on('before-quit', () => {
  poolMap.forEach(pool => pool.end())
})

export async function pgQuery({
  connectionString,
  sql,
  params,
  method,
}: QueryParams): Promise<DatabaseQueryResult> {
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

export async function pgTestConnection({ connectionString }: { connectionString: string }) {
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
