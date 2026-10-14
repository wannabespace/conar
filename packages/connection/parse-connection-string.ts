import { SafeURL } from '@tamery/shared/safe-url'
import { decodeURIComponentOrRaw, lowercaseKeys } from '@tamery/shared/utils'

export interface Config {
  user?: string
  password?: string
  host: string
  port?: number
  database?: string
  searchParams: URLSearchParams
}

const IPV6_BRACKETS = /^\[(?<address>.*)\]$/u

/** Every reader of a stored string goes through here: `connectionParts.format` percent-encodes user, password and database, and SafeURL hands them back raw; the drivers and `connectionSecrets` match option keys lowercase, a paste says `sslPassword` or `TrustServerCertificate`. */
export const readConnectionString = (connectionString: string) => {
  const url = new SafeURL(connectionString)
  return {
    database: decodeURIComponentOrRaw(url.pathname.slice(1)),
    host: url.hostname.replace(IPV6_BRACKETS, '$<address>'),
    password: decodeURIComponentOrRaw(url.password),
    port: url.port,
    scheme: url.protocol.slice(0, -1),
    searchParams: lowercaseKeys(url.searchParams),
    user: decodeURIComponentOrRaw(url.username),
  }
}

export const parseConnectionString = (connectionString: string): Config => {
  const { database, host, password, port, searchParams, user } =
    readConnectionString(connectionString)

  return {
    database: database || undefined,
    host,
    password: password || undefined,
    port: port ? Number(port) : undefined,
    searchParams,
    user: user || undefined,
  }
}
