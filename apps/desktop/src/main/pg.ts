import type { QueryResult } from 'pg'
import type { DatabaseQueryResult } from './events'
import { createRequire } from 'node:module'
import { parseConnectionString } from '@conar/connection'
import { readSSLFiles } from '@conar/connection/server'

const pg = createRequire(import.meta.url)('pg') as typeof import('pg')

const parseDate = (value: string) => value

pg.types.setTypeParser(pg.types.builtins.DATE, parseDate)
pg.types.setTypeParser(pg.types.builtins.TIMESTAMP, parseDate)
pg.types.setTypeParser(pg.types.builtins.TIMESTAMPTZ, parseDate)
pg.types.setTypeParser(pg.types.builtins.TIME, parseDate)
pg.types.setTypeParser(pg.types.builtins.TIMETZ, parseDate)

export async function pgQuery({
  connectionString,
  query,
  values,
}: {
  connectionString: string
  query: string
  values?: unknown[]
}): Promise<DatabaseQueryResult[]> {
  const config = parseConnectionString(connectionString)
  const client = new pg.Client({
    ...config,
    ...(config.ssl ? { ssl: readSSLFiles(config.ssl) } : {}),
  })

  try {
    await client.connect()
    const result = await client.query(query, values)
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
