import { isConnectionFailure } from '@tamery/connection/diagnose'
import { isKeychainLocked } from '@tamery/shared/keychain'
import { toError } from '@tamery/shared/utils'
import type { ErrorComponentProps } from '@tanstack/react-router'

import { TableError } from '~/core/table/table-error'

export const TabError = ({ error }: ErrorComponentProps) => {
  const failure = toError(error)
  if (isKeychainLocked(error) || isConnectionFailure(failure.message)) {
    throw error
  }
  return <TableError error={failure} />
}
