import { readConnectionString } from './parse-connection-string'

const WINDOWS_DRIVE = /^[a-z]:\//iu

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
  name: (path: string) => path.split(/[\\/]/u).at(-1) ?? path,
  path: (connectionString: string) => {
    const { database } = readConnectionString(connectionString)
    return WINDOWS_DRIVE.test(database)
      ? database
      : `/${database.replace(/^\/+/u, '')}`
  },
}
