import { readConnectionString } from './parse-connection-string'

const WINDOWS_DRIVE = /^[a-z]:\//iu

/** The one database SQLite opens a file as. */
export const SQLITE_RESOURCE_NAME = 'main'

/**
 * A SQLite string is `sqlite://` and the file's absolute path, never a host. The cloud proxy refuses an empty host,
 * and the executor refuses any other, which together keep a server from ever opening a file on its own disk.
 */
export const sqliteFile = {
  connectionString: (path: string) => {
    const slashed = path.replaceAll('\\', '/')
    const absolute = slashed.startsWith('/') ? slashed : `/${slashed}`
    return `sqlite://${absolute.split('/').map(encodeURIComponent).join('/')}`
  },
  path: (connectionString: string) => {
    const { database } = readConnectionString(connectionString)
    return WINDOWS_DRIVE.test(database)
      ? database
      : `/${database.replace(/^\/+/u, '')}`
  },
}
