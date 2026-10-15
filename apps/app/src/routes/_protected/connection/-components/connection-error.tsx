import { Alert02Icon, LockKeyIcon } from '@hugeicons/core-free-icons'
import { isConnectionFailure } from '@tamery/connection/diagnose'
import { isKeychainLocked } from '@tamery/shared/keychain'
import { Button } from '@tamery/ui/components/button'
import { useQueryErrorResetBoundary } from '@tanstack/react-query'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { getRouteApi, useNavigate } from '@tanstack/react-router'

import { PaneEmpty } from '~/components/pane-empty'
import { useDiagnosis } from '~/core/connection/diagnosis'
import { restartToUnlock } from '~/core/connection/keychain'
import { useGoBack } from '~/hooks/use-go-back'
import { posthog } from '~/lib/posthog'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

export const ConnectionError = ({ error, reset }: ErrorComponentProps) => {
  const { connection } = useRouteContext()
  const queryErrors = useQueryErrorResetBoundary()
  const goBack = useGoBack()
  const navigate = useNavigate()
  const locked = isKeychainLocked(error)
  const failed = !locked && isConnectionFailure(error.message)
  const diagnosis = useDiagnosis(connection.id, error, failed)

  // Anything else but the database failing is an app bug: the root error page reports it.
  if (!(locked || failed)) {
    throw error
  }

  // A locked keychain clears only on restart, so it offers no Try again.
  const { actions, ...pane } = locked
    ? {
        actions: <Button onClick={restartToUnlock}>Restart Tamery</Button>,
        description: error.message,
        icon: LockKeyIcon,
        title: 'Connections are locked',
      }
    : {
        actions: (
          <>
            <Button
              variant="outline"
              onClick={() => {
                posthog.capture('connection_retried')
                // A failed query stays failed for an error boundary until its reset boundary lets it retry on mount.
                queryErrors.reset()
                reset()
              }}
            >
              Try again
            </Button>
            <Button
              onClick={() => {
                posthog.capture('connection_edit_opened')
                void navigate({
                  params: { connectionId: connection.id },
                  to: '/edit/$connectionId',
                })
              }}
            >
              Edit connection
            </Button>
          </>
        ),
        description: (
          <span data-mask className="font-mono wrap-break-word select-text">
            {error.message}
          </span>
        ),
        icon: Alert02Icon,
        title: diagnosis?.title ?? "Couldn't connect",
      }

  return (
    <div className="flex h-screen min-h-[inherit] flex-col">
      <PaneEmpty variant="destructive" {...pane}>
        <div className="flex gap-2">
          <Button variant="outline" onClick={goBack}>
            Back
          </Button>
          {actions}
        </div>
      </PaneEmpty>
    </div>
  )
}
