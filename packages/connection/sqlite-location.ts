export type SqliteLocation = 'd1' | 'file' | 'libsql'

export const SQLITE_RESOURCE_NAME = 'main'

/**
 * A D1 string names Cloudflare's API host, so the cloud proxy sees a public host; its executor sends the token to this
 * host whatever the string says.
 */
export const D1_HOST = 'api.cloudflare.com'

/**
 * The host alone decides, for every reader of a string or form: none is a file on this computer, Cloudflare's API is
 * D1, any other is a libSQL server. A server therefore never opens a file, whatever the scheme says.
 */
export const getSqliteLocation = (host: string): SqliteLocation => {
  if (!host) {
    return 'file'
  }
  return host === D1_HOST ? 'd1' : 'libsql'
}
