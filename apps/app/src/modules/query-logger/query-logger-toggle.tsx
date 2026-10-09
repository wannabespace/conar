import { File01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { KbdCtrlLetter } from '@tamery/ui/components/custom/shortcuts'
import { SidebarMenuButton } from '@tamery/ui/components/sidebar'
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
          <SidebarMenuButton
            aria-pressed={loggerOpened}
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
