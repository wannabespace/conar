import { toConnectionString } from '@tamery/connection/connection-parts'
import { connectionSecrets } from '@tamery/connection/secrets'
import { isLocalNetworkConnectionString } from '@tamery/connection/utils'
import { SafeURL } from '@tamery/shared/safe-url'
import { tryCatch } from '@tamery/shared/utils'

import { fetchingConfig } from '~/core/connection/fetching-config'

import type { ConnectionFormValues } from './connection-form'
import { partsOf } from './connection-form'
import type { FormMode } from './use-save-connection'

/** Host holds whatever is typed until it blurs, so the string may not build yet. */
export const draftFetching = (
  values: ConnectionFormValues,
  isLocalProxyAvailable: boolean,
  mode: FormMode
) => {
  const built = tryCatch(() => toConnectionString(partsOf(values))).data ?? ''
  const saved = mode.kind === 'edit' && built ? mode : null
  const connectionString = saved
    ? connectionSecrets.keepMissing(built, saved.missingSecrets)
    : built
  const hasPassword = !!connectionString && !!values.password
  const { canSend, reason } = fetchingConfig(
    {
      isPasswordExists: hasPassword || !!saved?.passwordElsewhere,
      syncType: values.syncType,
    },
    {
      hasLocalConnectionString: true,
      isLocalNetwork:
        tryCatch(() => isLocalNetworkConnectionString(connectionString))
          .data === true,
      isLocalProxyAvailable,
      isPasswordPopulated: hasPassword,
      missingSecrets: saved
        ? connectionSecrets.missing(new SafeURL(connectionString).searchParams)
        : [],
      usesSsh: values.sshEnabled,
    }
  )

  return { canSend: canSend && !!connectionString, connectionString, reason }
}
