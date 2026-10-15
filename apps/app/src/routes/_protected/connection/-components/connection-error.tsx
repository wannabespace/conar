import { Alert02Icon } from '@hugeicons/core-free-icons'
import { Button } from '@tamery/ui/components/button'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { getRouteApi, useNavigate } from '@tanstack/react-router'

import { PaneEmpty } from '~/components/pane-empty'
import { isConnectionFailure } from '~/core/connection/connection-failure'
import { useGoBack } from '~/hooks/use-go-back'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

export const ConnectionError = ({ error }: ErrorComponentProps) => {
  const { connection } = useRouteContext()
  const goBack = useGoBack()
  const navigate = useNavigate()

  // Anything but the database failing is an app bug: the root error page reports it.
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
