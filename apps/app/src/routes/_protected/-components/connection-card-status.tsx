import { Alert02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { toConnectionParts } from '@tamery/connection/connection-parts'
import { diagnoseConnectionError } from '@tamery/connection/diagnose'
import { Spinner } from '@tamery/ui/components/spinner'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { useQuery } from '@tanstack/react-query'

import { useCollections } from '~/core/collections'

import { ConnectionCardReason } from './connection-card-reason'

const ErrorStatus = ({
  connectionId,
  error,
}: {
  connectionId: string
  error: Error
}) => {
  const { connectionStringsCollection } = useCollections()
  const { data: diagnosis } = useQuery({
    queryFn: async () =>
      diagnoseConnectionError({
        desktop: !!window.electron,
        message: error.message,
        parts: toConnectionParts(
          await connectionStringsCollection.utils.decrypt(connectionId)
        ),
      }),
    queryKey: ['connection', connectionId, 'diagnosis', error.message],
  })

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <HugeiconsIcon
            icon={Alert02Icon}
            strokeWidth={2}
            className="text-warning pointer-events-auto size-3 shrink-0"
          />
        }
      />
      <TooltipContent className="pointer-events-auto block max-w-3xs">
        {diagnosis ? (
          <>
            <span data-mask className="block">
              {diagnosis.title}
            </span>
            <span data-mask className="opacity-50">
              {diagnosis.hint}
            </span>
          </>
        ) : (
          <>
            <span className="opacity-50">Failed to get resources: </span>
            <span data-mask>{error.message}</span>
          </>
        )}
      </TooltipContent>
    </Tooltip>
  )
}

export const ConnectionCardStatus = ({
  canSend,
  connectionId,
  error,
  isLoadingVisible,
  reason,
}: {
  canSend: boolean
  connectionId: string
  error: Error | null
  isLoadingVisible: boolean
  reason: string | null
}) => {
  if (isLoadingVisible && canSend) {
    return <Spinner className="size-3 shrink-0" />
  }
  if (reason) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <HugeiconsIcon
              icon={Alert02Icon}
              strokeWidth={2}
              className="text-muted-foreground pointer-events-auto size-3 shrink-0"
            />
          }
        />
        <TooltipContent className="pointer-events-auto block max-w-xs">
          <ConnectionCardReason reason={reason} />
        </TooltipContent>
      </Tooltip>
    )
  }
  if (error) {
    return <ErrorStatus connectionId={connectionId} error={error} />
  }
  return null
}
