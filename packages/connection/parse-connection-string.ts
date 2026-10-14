import { SafeURL } from '@tamery/shared/safe-url'
import { tryCatch } from '@tamery/shared/utils'

export interface Config {
  user?: string
  password?: string
  host: string
  port?: number
  database?: string
  searchParams: URLSearchParams
}

const IPV6_BRACKETS = /^\[(?<address>.*)\]$/u

/** A raw `%` a user pasted (`100%`) reads as typed. */
const decoded = (component: string) =>
  tryCatch(() => decodeURIComponent(component)).data ?? component

/** Every reader of a stored string goes through here: `toConnectionString` percent-encodes user, password and database, and SafeURL hands them back raw. */
export const readConnectionString = (connectionString: string) => {
  const url = new SafeURL(connectionString)
  return {
    database: decoded(url.pathname.slice(1)),
    host: url.hostname.replace(IPV6_BRACKETS, '$<address>'),
    password: decoded(url.password),
    port: url.port,
    scheme: url.protocol.slice(0, -1),
    searchParams: url.searchParams,
    user: decoded(url.username),
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
    /** Keys lowercased: the SSL parsers read lowercase, a paste says `TrustServerCertificate` or `sslMode`. */
    searchParams: new URLSearchParams(
      Array.from(searchParams, ([key, value]) => [key.toLowerCase(), value])
    ),
    user: user || undefined,
  }
}
