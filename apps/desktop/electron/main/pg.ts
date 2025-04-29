import type { Pool, QueryResult } from 'pg'
import type { DatabaseQueryResult } from './events'
import { createRequire } from 'node:module'

const pg = createRequire(import.meta.url)('pg') as typeof import('pg')

const pools: Record<string, { pool: Pool, count: number }> = {}

export async function pgQuery({
  connectionString,
  query,
  values,
}: {
  connectionString: string
  query: string
  values?: unknown[]
}): Promise<DatabaseQueryResult[]> {
  if (!pools[connectionString]) {
    pools[connectionString] = {
      pool: new pg.Pool({
        connectionString,
      }),
      count: 0,
    }
  }

  try {
    pools[connectionString].count++
    const result = await pools[connectionString].pool.query(query, values)
    const array = (Array.isArray(result) ? result : [result]) as QueryResult[]

    return array.map(r => ({
      count: r.rowCount ?? 0,
      columns: r.fields.map(f => ({
        name: f.name,
      })),
      rows: r.rows,
    }))
  }
  finally {
    pools[connectionString].count--
    if (pools[connectionString].count === 0) {
      await pools[connectionString].pool.end()
      delete pools[connectionString]
    }
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
