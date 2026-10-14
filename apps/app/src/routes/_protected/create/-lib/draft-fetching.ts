import { toConnectionString } from '@tamery/connection/connection-parts'
import { isLocalNetworkConnectionString } from '@tamery/connection/utils'
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
  const hasPassword = !!connectionString && !!values.password
  const { canSend, reason } = fetchingConfig(
    { isPasswordExists: hasPassword, syncType: values.syncType },
    {
      hasLocalConnectionString: true,
      isLocalProxyAvailable,
      isLocalNetwork:
        tryCatch(() => isLocalNetworkConnectionString(connectionString))
          .data === true,
      isPasswordPopulated: hasPassword,
      secretsMissing: false,
      usesSsh: values.sshEnabled,
    }
  )

  return { canSend: canSend && !!connectionString, connectionString, reason }
}
