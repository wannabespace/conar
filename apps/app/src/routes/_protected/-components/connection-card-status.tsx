import { Alert02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Spinner } from '@tamery/ui/components/spinner'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'

import { ConnectionCardError } from './connection-card-error'
import { ConnectionCardReason } from './connection-card-reason'

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
    return <ConnectionCardError connectionId={connectionId} error={error} />
  }
  return null
}
