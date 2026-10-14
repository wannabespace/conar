import { SafeURL } from '@tamery/shared/safe-url'
import { lowercaseKeys } from '@tamery/shared/utils'

import { SSH_PARAMS } from './ssh/params'

/** The query params `CloudWithoutSecrets` keeps off the server beside the database password; sync with what `ssl/*.ts` and `ssh/` read. */
const SECRET_PARAMS = [
  SSH_PARAMS.password,
  SSH_PARAMS.privateKey,
  SSH_PARAMS.passphrase,
  'sslpassword',
  'sslpassphrase',
] as const

export type SecretParam = (typeof SECRET_PARAMS)[number]

const urlOf = (connectionString: string) => {
  const url = new SafeURL(connectionString)
  url.search = lowercaseKeys(url.searchParams).toString()
  return url
}

/** `strip` empties a secret rather than dropping it, so another device knows which ones to ask for. */
export const connectionSecrets = {
  missing: (searchParams: URLSearchParams): SecretParam[] =>
    SECRET_PARAMS.filter((param) => searchParams.get(param) === ''),
  /** `isPasswordExists` is the synced connection's flag: an empty synced password is only a stripped one while it is set, otherwise another device removed it. */
  restore: (
    connectionString: string,
    { isPasswordExists, local }: { isPasswordExists: boolean; local: string }
  ) => {
    const url = urlOf(connectionString)
    const localUrl = urlOf(local)
    if (isPasswordExists) {
      url.password ||= localUrl.password
    }
    for (const param of connectionSecrets.missing(url.searchParams)) {
      const value = localUrl.searchParams.get(param)
      if (value) {
        url.searchParams.set(param, value)
      }
    }
    return url.toString()
  },
  stored: (connectionString: string) => {
    const url = urlOf(connectionString)
    return (
      !!url.password ||
      SECRET_PARAMS.some((param) => url.searchParams.get(param))
    )
  },
  strip: (connectionString: string) => {
    const url = urlOf(connectionString)
    url.password = ''
    for (const param of SECRET_PARAMS) {
      if (url.searchParams.has(param)) {
        url.searchParams.set(param, '')
      }
    }
    return url.toString()
  },
}
