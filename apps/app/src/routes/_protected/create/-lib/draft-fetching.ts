import { toConnectionString } from '@tamery/connection/connection-parts'
import { isLocalhostConnectionString } from '@tamery/connection/utils'
import { SafeURL } from '@tamery/shared/safe-url'
import { tryCatch } from '@tamery/shared/utils'

import { fetchingConfig } from '~/core/connection/fetching-config'

import type { ConnectionFormValues } from './connection-form'
import { partsOf } from './connection-form'

/** Host holds whatever is typed until it blurs, so the string may not build yet. */
export const draftFetching = (
  values: ConnectionFormValues,
  isLocalProxyAvailable: boolean
) => {
  const connectionString =
    tryCatch(() => toConnectionString(partsOf(values))).data ?? ''
  const hasPassword = !!tryCatch(() => new SafeURL(connectionString)).data
    ?.password
  const { canSend, reason } = fetchingConfig(
    { isPasswordExists: hasPassword, syncType: values.syncType },
    {
      hasLocalConnectionString: true,
      isLocalProxyAvailable,
      isLocalhost:
        tryCatch(() => isLocalhostConnectionString(connectionString)).data ===
        true,
      isPasswordPopulated: hasPassword,
      usesSsh: values.sshEnabled,
    }
  )

  return { canSend: canSend && !!connectionString, connectionString, reason }
}
