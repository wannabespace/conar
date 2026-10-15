import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import { tryCatchAsync } from '@tamery/shared/utils'

import type { Unlocked } from './local-database'

// `security`'s exit code for errSecItemNotFound: the app never saved a password, so nothing was withheld.
const ITEM_NOT_FOUND = 44

/** Shows the user one Keychain prompt. `withheld` means a saved password exists but the user denied it. */
export const keychainPassword = async ({
  account,
  service,
}: {
  account?: string
  service: string
}): Promise<Unlocked> => {
  if (process.platform !== 'darwin') {
    return { password: '', withheld: false }
  }
  const { data, error } = await tryCatchAsync(() =>
    promisify(execFile)('/usr/bin/security', [
      'find-generic-password',
      '-s',
      service,
      ...(account ? ['-a', account] : []),
      '-w',
    ])
  )
  return {
    password: data?.stdout.replace(/\n$/u, '') ?? '',
    withheld: !!error && !('code' in error && error.code === ITEM_NOT_FOUND),
  }
}
