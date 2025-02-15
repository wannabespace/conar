import pg from 'pg'

export async function pgQuery({
  connectionString,
  query,
  values,
}: {
  connectionString: string
  query: string
  values?: string[]
}) {
  const pool = new pg.Pool({
    connectionString,
  })

  try {
    const result = await pool.query(query, values)

    return result.rows
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
