import type { ClientConfig, QueryResult } from 'pg'
import type { DatabaseQueryResult } from './events'
import { parseUrl } from '@conar/shared/utils/url'
import pg from 'pg'

const parseDate = (value: string) => value

pg.types.setTypeParser(pg.types.builtins.DATE, parseDate)
pg.types.setTypeParser(pg.types.builtins.TIMESTAMP, parseDate)
pg.types.setTypeParser(pg.types.builtins.TIMESTAMPTZ, parseDate)
pg.types.setTypeParser(pg.types.builtins.TIME, parseDate)
pg.types.setTypeParser(pg.types.builtins.TIMETZ, parseDate)

function getClientConfig(connectionString: string): ClientConfig {
  // We shouldn't pass connection string to pg.Client because it cannot parse special characters in password like #
  const parsed = parseUrl(connectionString)
  return {
    host: parsed.hostname,
    port: Number.parseInt(parsed.port, 10),
    user: parsed.username,
    password: parsed.password,
    database: parsed.pathname.slice(1),
    options: JSON.stringify(Object.fromEntries(parsed.searchParams.entries())),
  }
}

export async function pgQuery({
  connectionString,
  query,
  values,
}: {
  connectionString: string
  query: string
  values?: unknown[]
}): Promise<DatabaseQueryResult[]> {
  const pool = new pg.Pool(getClientConfig(connectionString))

  try {
    const result = await pool.query(query, values)
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
    await pool.end()
  }
}

export async function pgTestConnection({ connectionString }: { connectionString: string }) {
  const client = new pg.Client(getClientConfig(connectionString))

  try {
    await client.connect()

    return true
  }
  finally {
    await client.end()
  }
}
