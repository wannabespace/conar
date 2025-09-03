import type { ClientConfig, QueryResult } from 'pg'
import type { DatabaseQueryResult } from './events'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import { parseUrl } from '@conar/shared/utils/url'

const pg = createRequire(import.meta.url)('pg') as typeof import('pg')

const parseDate = (value: string) => value

pg.types.setTypeParser(pg.types.builtins.DATE, parseDate)
pg.types.setTypeParser(pg.types.builtins.TIMESTAMP, parseDate)
pg.types.setTypeParser(pg.types.builtins.TIMESTAMPTZ, parseDate)
pg.types.setTypeParser(pg.types.builtins.TIME, parseDate)
pg.types.setTypeParser(pg.types.builtins.TIMETZ, parseDate)

function parseConnectionString(connectionString: string): ClientConfig {
  // We shouldn't pass connectionString to pg.Client because it cannot parse special characters in password like #
  const parsed = parseUrl(encodeURI(connectionString).replace(/%25(\d\d)/g, '%$1'))
  const config: ClientConfig = {
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    host: parsed.hostname,
  }

  Object.assign(config, Object.fromEntries(parsed.searchParams.entries()))

  if (parsed.pathname.slice(1)) {
    config.database = parsed.pathname.slice(1)
  }

  if (parsed.port) {
    config.port = Number.parseInt(parsed.port)
  }

  const ssl = parsed.searchParams.get('ssl')

  if (ssl === 'true' || ssl === '1') {
    config.ssl = true
  }

  if (ssl === '0') {
    config.ssl = false
  }

  const sslcert = parsed.searchParams.get('sslcert')
  const sslkey = parsed.searchParams.get('sslkey')
  const sslrootcert = parsed.searchParams.get('sslrootcert')
  const sslmode = parsed.searchParams.get('sslmode')

  if (sslcert || sslkey || sslrootcert || sslmode) {
    config.ssl = {}

    if (sslcert) {
      config.ssl.cert = fs.readFileSync(sslcert).toString()
    }
    if (sslkey) {
      config.ssl.key = fs.readFileSync(sslkey).toString()
    }
    if (sslrootcert) {
      config.ssl.ca = fs.readFileSync(sslrootcert).toString()
    }
    if (sslmode === 'disable') {
      config.ssl = false
    }
  }

  return config
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
  const pool = new pg.Pool(parseConnectionString(connectionString))

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
  const client = new pg.Client(parseConnectionString(connectionString))

  try {
    await client.connect()

    return true
  }
  finally {
    await client.end()
  }
}
