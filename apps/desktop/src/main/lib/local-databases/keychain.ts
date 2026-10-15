import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import { connectionParts } from '@tamery/connection/connection-parts'
import { tryCatchAsync } from '@tamery/shared/utils'

interface KeychainItem {
  account?: string
  service: string
}

// `security`'s exit code for errSecItemNotFound: the app never saved a password, so nothing was withheld.
const ITEM_NOT_FOUND = 44

// Keyed by what `find` returned, so the renderer can only unlock a password a found database points at, never name an arbitrary Keychain item.
const itemOf = new Map<string, KeychainItem>()

const read = async ({ account, service }: KeychainItem) => {
  const { stdout } = await promisify(execFile)('/usr/bin/security', [
    'find-generic-password',
    '-s',
    service,
    ...(account ? ['-a', account] : []),
    '-w',
  ])
  return stdout.replace(/\n$/u, '')
}

export const keychain = {
  remember: (connectionString: string, item: KeychainItem) => {
    if (process.platform === 'darwin') {
      itemOf.set(connectionString, item)
    }
  },
  /** Asks macOS for the found database's password, which shows the user one Keychain prompt. `withheld` means a saved password exists but the user denied it. */
  unlock: async (connectionString: string) => {
    const item = itemOf.get(connectionString)
    if (!item) {
      return { connectionString, withheld: false }
    }
    const { data: password, error } = await tryCatchAsync(() => read(item))
    if (!password) {
      return {
        connectionString,
        withheld:
          !!error && !('code' in error && error.code === ITEM_NOT_FOUND),
      }
    }
    return {
      connectionString: connectionParts.format({
        ...connectionParts.parse(connectionString),
        password,
      }),
      withheld: false,
    }
  },
}
