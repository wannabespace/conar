import type { DatabaseCredentials } from '@connnect/shared/types/database'
import pg from 'pg'

export async function pgQuery({
  credentials,
  query,
  values,
}: {
  credentials: DatabaseCredentials
  query: string
  values?: string[]
}) {
  const pool = new pg.Pool({
    host: credentials.host,
    port: credentials.port,
    user: credentials.username,
    password: credentials.password,
    database: credentials.database,
  })

  try {
    const result = await pool.query(query, values)

    return result.rows
  }
  finally {
    await pool.end()
  }
}

export async function pgTestConnection({ credentials }: { credentials: DatabaseCredentials }) {
  const client = new pg.Client({
    host: credentials.host,
    port: credentials.port,
    user: credentials.username,
    password: credentials.password,
    database: credentials.database,
    options: credentials.options,
  })

  try {
    await client.connect()

    return true
  }
  finally {
    await client.end()
  }
}
