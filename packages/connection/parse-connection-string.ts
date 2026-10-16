import { SafeURL } from '@tamery/shared/safe-url'
import { decodeURIComponentOrRaw, lowercaseKeys } from '@tamery/shared/utils'

/** Every reader of a stored string must go through here: it decodes the percent-encoded fields and lowercases option keys. */
export const readConnectionString = (connectionString: string) => {
  const url = new SafeURL(connectionString)
  return {
    database: decodeURIComponentOrRaw(url.pathname.slice(1)),
    host: url.hostname.replace(/^\[(?<address>.*)\]$/u, '$<address>'),
    password: decodeURIComponentOrRaw(url.password),
    port: url.port,
    scheme: url.protocol.slice(0, -1),
    searchParams: lowercaseKeys(url.searchParams),
    user: decodeURIComponentOrRaw(url.username),
  }
}

/** Absent fields stay `undefined`, the drivers' spelling for "use your default": an empty string or a `0` port reaches them as a real value. */
export const getDriverConfig = (connectionString: string) => {
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
