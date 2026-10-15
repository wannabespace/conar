import { isConnectionFailure } from '@tamery/connection/diagnose'
import { isKeychainLocked } from '@tamery/shared/keychain'
import type { ErrorComponentProps } from '@tanstack/react-router'

import { ConnectionFailure } from './connection-failure'

export const ConnectionError = (props: ErrorComponentProps) => {
  // Anything but the database failing (an app bug, a locked keychain) goes to the root error page.
  if (
    isKeychainLocked(props.error) ||
    !isConnectionFailure(props.error.message)
  ) {
    throw props.error
  }
  return <ConnectionFailure {...props} />
}
