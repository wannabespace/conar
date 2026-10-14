import { SafeURL } from '@tamery/shared/safe-url'

import { AUTH_PARAMS, SSH_PARAMS, sshTunnelOf } from './ssh/params'

/** The query params `CloudWithoutPassword` keeps off the server beside the database password; sync with what `ssl/*.ts` and `ssh/` read. */
const SECRET_PARAMS = [
  SSH_PARAMS.password,
  SSH_PARAMS.privateKey,
  SSH_PARAMS.passphrase,
  'sslpassword',
  'sslpassphrase',
] as const

export type SecretParam = (typeof SECRET_PARAMS)[number]

/** `strip` empties a secret rather than dropping it, so another device knows which ones to ask for. */
export const connectionSecrets = {
  /** Puts back the markers an edit form drops (it never writes an empty SSH secret), so the device that lacked a secret still asks for it and the others keep theirs; only for secrets the tunnel still signs in with. */
  keepMissing: (connectionString: string, missing: SecretParam[]) => {
    const url = new SafeURL(connectionString)
    const tunnel = sshTunnelOf(url.searchParams)
    const used = new Set<string>(
      tunnel ? AUTH_PARAMS[tunnel.auth].map((key) => SSH_PARAMS[key]) : []
    )
    for (const param of missing) {
      if (used.has(param) && !url.searchParams.get(param)) {
        url.searchParams.set(param, '')
      }
    }
    return url.toString()
  },
  missing: (searchParams: URLSearchParams): SecretParam[] =>
    SECRET_PARAMS.filter((param) => searchParams.get(param) === ''),
  /** Fills only what `strip` emptied: a secret the synced string no longer carries stays gone. */
  restore: (connectionString: string, local: string) => {
    const url = new SafeURL(connectionString)
    const localUrl = new SafeURL(local)
    url.password ||= localUrl.password
    for (const param of connectionSecrets.missing(url.searchParams)) {
      const value = localUrl.searchParams.get(param)
      if (value) {
        url.searchParams.set(param, value)
      }
    }
    return url.toString()
  },
  strip: (connectionString: string) => {
    const url = new SafeURL(connectionString)
    url.password = ''
    for (const param of SECRET_PARAMS) {
      if (url.searchParams.has(param)) {
        url.searchParams.set(param, '')
      }
    }
    return url.toString()
  },
}
