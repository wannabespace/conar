import {
  isKeychainLocked,
  KEYCHAIN_LOCKED_ERROR,
} from '@tamery/shared/keychain'
import { toast } from 'sonner'

import { posthog } from '~/lib/posthog'

export const restartToUnlock = () => {
  posthog.capture('app_restarted_to_unlock')
  window.electron?.app.relaunch()
}

export const toastUnhandledKeychainLocks = () =>
  window.addEventListener('unhandledrejection', (event) => {
    if (!isKeychainLocked(event.reason)) {
      return
    }
    event.preventDefault()
    toast.error(KEYCHAIN_LOCKED_ERROR, {
      action: { label: 'Restart', onClick: restartToUnlock },
      id: 'keychain-locked',
    })
  })
