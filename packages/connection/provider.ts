import { ConnectionType, Provider } from '@tamery/shared/enums/connection-type'

/**
 * A D1 string names Cloudflare's API host, so the cloud proxy sees a public host; its executor sends the token to this
 * host whatever the string says.
 */
export const D1_HOST = 'api.cloudflare.com'

/**
 * The host alone decides, for every reader of a string or form: none is a file on this computer (no provider),
 * Cloudflare's API is D1, any other is a libSQL server, which reads as Turso. A server therefore never opens a file,
 * whatever the scheme says.
 */
export const getSqliteProvider = (host: string) => {
  if (!host) {
    return null
  }
  return host === D1_HOST ? Provider.CloudflareD1 : Provider.Turso
}

export const getProvider = ({
  host,
  type,
}: {
  host: string
  type: ConnectionType | null
}) => (type === ConnectionType.SQLite ? getSqliteProvider(host) : null)
