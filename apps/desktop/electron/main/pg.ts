import type { QueryResult } from 'pg'
import type { DatabaseQueryResult } from './events'
import { createRequire } from 'node:module'

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
  const pool = new pg.Pool({
    connectionString,
  })

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
