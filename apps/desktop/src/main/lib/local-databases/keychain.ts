import { AsyncEntry, findCredentialsAsync } from '@napi-rs/keyring'
import { tryCatchAsync } from '@tamery/shared/utils'

import type { Unlocked } from './local-database'
import { NOTHING_UNLOCKED } from './local-database'

// keyring-core's message for an OSStatus it has no name for, which is how a denied or dismissed prompt arrives; a missing item resolves empty instead.
const DENIED = /^Platform failure/u

/** Shows the user one Keychain prompt. `withheld` means a saved password exists but the user denied it. Without `account`, a denied item is skipped, so it is never `withheld`. */
export const keychainPassword = async ({
  account,
  service,
}: {
  account?: string
  service: string
}): Promise<Unlocked> => {
  if (process.platform !== 'darwin') {
    return NOTHING_UNLOCKED
  }
  const { data, error } = await tryCatchAsync(async () => {
    if (account !== undefined) {
      return new AsyncEntry(service, account).getPassword()
    }
    const [credential] = await findCredentialsAsync(service)
    return credential?.password
  })
  return {
    password: data ?? '',
    withheld: DENIED.test(error?.message ?? ''),
  }
}
