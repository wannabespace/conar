import { Alert02Icon, LockKeyIcon } from '@hugeicons/core-free-icons'
import { isKeychainLocked } from '@tamery/shared/keychain'
import { Button } from '@tamery/ui/components/button'
import { useQueryErrorResetBoundary } from '@tanstack/react-query'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { getRouteApi, useNavigate } from '@tanstack/react-router'

import { PaneEmpty } from '~/components/pane-empty'
import { isConnectionFailure } from '~/core/connection/connection-failure'
import { useGoBack } from '~/hooks/use-go-back'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

export const ConnectionError = ({ error, reset }: ErrorComponentProps) => {
  const { connection } = useRouteContext()
  const queryErrors = useQueryErrorResetBoundary()
  const goBack = useGoBack()
  const navigate = useNavigate()

  // A locked keychain clears only on restart, so it offers no Try again.
  if (isKeychainLocked(error)) {
    return (
      <div className="flex h-screen min-h-[inherit] flex-col">
        <PaneEmpty
          variant="destructive"
          icon={LockKeyIcon}
          title="Connections are locked"
          description={error.message}
        >
          <div className="flex gap-2">
            <Button variant="outline" onClick={goBack}>
              Back
            </Button>
            <Button onClick={() => window.electron?.app.relaunch()}>
              Restart Tamery
            </Button>
          </div>
        </PaneEmpty>
      </div>
    )
  }

  // Anything else but the database failing is an app bug: the root error page reports it.
  if (!isConnectionFailure(error)) {
    throw error
  }

  return (
    <div className="flex h-screen min-h-[inherit] flex-col">
      <PaneEmpty
        variant="destructive"
        icon={Alert02Icon}
        title="Couldn't connect"
        description={
          <span data-mask className="font-mono wrap-break-word select-text">
            {error.message}
          </span>
        }
      >
        <div className="flex gap-2">
          <Button variant="outline" onClick={goBack}>
            Back
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              // A failed query stays failed for an error boundary until its reset boundary lets it retry on mount.
              queryErrors.reset()
              reset()
            }}
          >
            Try again
          </Button>
          <Button
            onClick={() =>
              navigate({
                params: { connectionId: connection.id },
                to: '/edit/$connectionId',
              })
            }
          >
            Edit connection
          </Button>
        </div>
      </PaneEmpty>
    </div>
  )
}
