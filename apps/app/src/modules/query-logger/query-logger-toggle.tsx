import { File01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import { KbdCtrlLetter } from '@tamery/ui/components/custom/shortcuts'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { useHotkey } from '@tanstack/react-hotkeys'
import { getRouteApi } from '@tanstack/react-router'
import { useSubscription } from 'seitu/react'

import { posthog } from '~/lib/posthog'

import { loggerOpen } from './logger-open'

const { useParams } = getRouteApi('/_protected/connection/$resourceId')

const toggleLogger = (resourceId: string) => {
  loggerOpen(resourceId).set((opened) => !opened)
  posthog.capture('query_logger_toggled')
}

export const QueryLoggerHotkey = () => {
  const { resourceId } = useParams()

  useHotkey('Mod+J', (e) => {
    e.preventDefault()
    toggleLogger(resourceId)
  })

  return null
}

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
            size="sm"
            aria-pressed={loggerOpened}
            // oxlint-disable-next-line shadcn/no-restyle -- navigator footer rows match the list rows above
            className="h-7 w-full justify-start gap-2 rounded-md px-2"
            onClick={() => toggleLogger(resourceId)}
          />
        }
      >
        <HugeiconsIcon
          icon={File01Icon}
          strokeWidth={2}
          className="text-muted-foreground size-4 shrink-0"
        />
        Query logger
      </TooltipTrigger>
      <TooltipContent side="right">Toggle query logger</TooltipContent>
    </Tooltip>
  )
}
