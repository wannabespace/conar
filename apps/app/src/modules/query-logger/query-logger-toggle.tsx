import { File01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import { KbdCtrlLetter } from '@tamery/ui/components/custom/shortcuts'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { getRouteApi } from '@tanstack/react-router'
import { useSubscription } from 'seitu/react'

import { loggerOpen, toggleLogger } from './logger-open'

const { useParams } = getRouteApi('/_protected/connection/$resourceId')

export const QueryLoggerToggle = () => {
  const { resourceId } = useParams()
  const loggerOpened = useSubscription(loggerOpen(resourceId))

  return (
    <Tooltip
      shortcut={<KbdCtrlLetter userAgent={navigator.userAgent} letter="J" />}
    >
      <TooltipTrigger
        render={
          <Button
            variant="ghost-row"
            size="row"
            aria-pressed={loggerOpened}
            className="w-full justify-start"
            onClick={() => toggleLogger(resourceId)}
          />
        }
      >
        <HugeiconsIcon
          icon={File01Icon}
          strokeWidth={2}
          className="text-muted-foreground"
        />
        Query logger
      </TooltipTrigger>
      <TooltipContent side="right">Toggle query logger</TooltipContent>
    </Tooltip>
  )
}
