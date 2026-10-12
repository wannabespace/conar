import { SafeURL } from '@tamery/shared/safe-url'

import { sshSecrets } from './ssh/params'

/** What `CloudWithoutPassword` keeps off the server: the database password and the SSH tunnel's secrets. */
export const connectionSecrets = {
  restore: (connectionString: string, local: string) => {
    const url = new SafeURL(connectionString)
    const localUrl = new SafeURL(local)
    url.password ||= localUrl.password
    sshSecrets.restore(url.searchParams, localUrl.searchParams)
    return url.toString()
  },
  strip: (connectionString: string) => {
    const url = new SafeURL(connectionString)
    url.password = ''
    sshSecrets.strip(url.searchParams)
    return url.toString()
  },
}
