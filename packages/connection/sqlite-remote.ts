import { SafeURL } from '@tamery/shared/safe-url'

/**
 * A D1 string names Cloudflare's API host, so the cloud proxy sees a public host; its executor sends the token to this
 * host whatever the string says.
 */
export const D1_HOST = 'api.cloudflare.com'

/** Where a SQLite connection's database lives: a file on this computer, a libSQL server (Turso), or Cloudflare D1. */
export type SqliteLocation = 'd1' | 'file' | 'libsql'

export const getSqliteLocation = (host: string): SqliteLocation => {
  if (host === D1_HOST) {
    return 'd1'
  }
  return host ? 'libsql' : 'file'
}

export const SQLITE_SCHEMES: Record<SqliteLocation, string> = {
  d1: 'd1',
  file: 'sqlite',
  libsql: 'libsql',
}

/**
 * The token rides in the password, so stripping, restoring and syncing it follow every other connection's password.
 * D1 keeps its account ID in the user and its database ID in the path.
 */
export const remoteSqliteString = ({
  database,
  host,
  options,
  password,
  port,
  user,
}: {
  database: string
  host: string
  options: string
  password: string
  port: string
  user: string
}) => {
  const url = new SafeURL(
    getSqliteLocation(host) === 'd1'
      ? `d1://${D1_HOST}/${encodeURIComponent(database)}`
      : `libsql://${host}${port ? `:${port}` : ''}`
  )
  url.username = encodeURIComponent(user)
  url.password = encodeURIComponent(password)
  url.search = options
  return url.toString()
}
