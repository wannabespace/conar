import { Alert02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Spinner } from '@tamery/ui/components/spinner'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'

export const ConnectionCardStatus = ({
  canSend,
  error,
  isLoadingVisible,
  reason,
}: {
  canSend: boolean
  error: Error | null
  isLoadingVisible: boolean
  reason: string | null
}) => {
  if (isLoadingVisible && canSend) {
    return <Spinner className="size-3 shrink-0" />
  }
  if (!canSend) {
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
        <TooltipContent className="pointer-events-auto max-w-xs">
          {reason}
        </TooltipContent>
      </Tooltip>
    )
  }
  if (error) {
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
          <span className="opacity-50">Failed to get resources: </span>
          <span data-mask>{error.message}</span>
        </TooltipContent>
      </Tooltip>
    )
  }
  return null
}
