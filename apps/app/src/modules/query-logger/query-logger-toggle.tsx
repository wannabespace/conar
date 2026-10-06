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
import { useParams } from '@tanstack/react-router'
import { useSubscription } from 'seitu/react'

import { posthog } from '~/lib/posthog'

import { loggerOpen } from './logger-open'

const QueryLoggerButton = ({ resourceId }: { resourceId: string }) => {
  const open = loggerOpen(resourceId)
  const loggerOpened = useSubscription(open)
  const toggleLogger = () => {
    open.set((opened) => !opened)
    posthog.capture('query_logger_toggled')
  }

  useHotkey('Mod+J', (e) => {
    e.preventDefault()
    toggleLogger()
  })

  return (
    <Tooltip
      shortcut={<KbdCtrlLetter userAgent={navigator.userAgent} letter="J" />}
    >
      <TooltipTrigger
        render={
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Query logger"
            aria-pressed={loggerOpened}
            onClick={toggleLogger}
          />
        }
      >
        <HugeiconsIcon icon={File01Icon} strokeWidth={2} className="size-4" />
      </TooltipTrigger>
      <TooltipContent side="left">Query logger</TooltipContent>
    </Tooltip>
  )
}

export const QueryLoggerToggle = () => {
  const { resourceId } = useParams({ strict: false })

  return resourceId ? <QueryLoggerButton resourceId={resourceId} /> : null
}
