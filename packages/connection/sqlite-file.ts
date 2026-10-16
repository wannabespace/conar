import { readConnectionString } from './parse-connection-string'

const WINDOWS_DRIVE = /^[a-z]:\//iu
const HOME = /^~\//u

/**
 * A SQLite string is `sqlite://` and the file's absolute path, never a host. The cloud proxy refuses an empty host,
 * and the executor refuses any other, which together keep a server from ever opening a file on its own disk.
 */
export const sqliteFile = {
  connectionString: (path: string) => {
    const slashed = path.trim().replaceAll('\\', '/')
    const absolute = slashed.startsWith('/') ? slashed : `/${slashed}`
    return `sqlite://${absolute.split('/').map(encodeURIComponent).join('/')}`
  },
  /** A `~/` path stays relative to the home folder of whichever computer opens it. */
  path: (connectionString: string) => {
    const database = readConnectionString(connectionString).database.replace(
      /^\/+/u,
      ''
    )
    return WINDOWS_DRIVE.test(database) || HOME.test(database)
      ? database
      : `/${database}`
  },
}
