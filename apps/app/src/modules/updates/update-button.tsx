import { Download01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import { Spinner } from '@tamery/ui/components/spinner'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { useSubscription } from 'seitu/react'

import { checkForUpdates, updatesStore } from './updates-observer'

export const UpdateButton = () => {
  const status = useSubscription(updatesStore, {
    selector: (state) => state.status,
  })

  if (!window.electron) {
    return null
  }

  if (status === 'ready') {
    return (
      <Button size="xs" onClick={() => window.electron?.app.quitAndInstall()}>
        Restart to update
      </Button>
    )
  }

  if (status !== 'checking' && status !== 'downloading') {
    return null
  }

  return (
    <Tooltip>
      <TooltipTrigger className="p-1">
        {status === 'checking' && (
          <Spinner className="text-muted-foreground size-4" />
        )}
        {status === 'downloading' && (
          <HugeiconsIcon
            icon={Download01Icon}
            strokeWidth={2}
            className="text-muted-foreground size-3 animate-bounce"
          />
        )}
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {status === 'checking' && 'Checking for updates…'}
        {status === 'downloading' && 'Downloading update…'}
      </TooltipContent>
    </Tooltip>
  )
}

export const VersionButton = () => {
  const version = useSubscription(updatesStore, {
    selector: (state) => state.version,
  })

  if (!window.electron) {
    return null
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label="Check for updates"
            className="text-2xs text-muted-foreground/60 hover:bg-foreground/5 hover:text-muted-foreground rounded-md px-1.5 py-0.5 tabular-nums"
            onClick={() => checkForUpdates()}
          />
        }
      >
        v{version}
      </TooltipTrigger>
      <TooltipContent side="bottom">Check for updates</TooltipContent>
    </Tooltip>
  )
}
