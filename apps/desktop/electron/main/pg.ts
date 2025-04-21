import type { QueryResult } from 'pg'
import type { DatabaseQueryResult } from './events'
import { createRequire } from 'node:module'

const pg = createRequire(import.meta.url)('pg') as typeof import('pg')

export async function pgQuery({
  connectionString,
  query,
  values,
}: {
  connectionString: string
  query: string
  values?: unknown[]
}): Promise<DatabaseQueryResult[]> {
  const pool = new pg.Pool({
    connectionString,
  })

  try {
    const result = await pool.query(query, values)
    const array = (Array.isArray(result) ? result : [result]) as QueryResult[]

    return array.map(r => ({
      count: r.rowCount ?? 0,
      columns: r.fields.map(f => f.name),
      rows: r.rows,
    }))
  }
  finally {
    await pool.end()
  }
}

export async function pgTestConnection({ connectionString }: { connectionString: string }) {
  const client = new pg.Client({
    connectionString,
  })

  try {
    await client.connect()

    return true
  }
  finally {
    await client.end()
  }
}
