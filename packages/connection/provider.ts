import { Provider } from '@tamery/shared/enums/connection-type'

/**
 * A D1 string names Cloudflare's API host, so the cloud proxy sees a public host; its executor sends the token to this
 * host whatever the string says.
 */
export const D1_HOST = 'api.cloudflare.com'

const PROVIDER_OF_SCHEME: Partial<Record<string, Provider>> = {
  d1: Provider.CloudflareD1,
  libsql: Provider.Turso,
}

/** `null` for a scheme Tamery does not know: a SQLite server is never guessed to be one it does. */
export const getProviderOfScheme = (scheme: string) =>
  PROVIDER_OF_SCHEME[scheme] ?? null
