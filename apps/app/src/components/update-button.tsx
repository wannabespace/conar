import { RiDownloadLine } from '@remixicon/react'
import { Button } from '@tamery/ui/components/button'
import { Spinner } from '@tamery/ui/components/spinner'
import { Tooltip, TooltipContent, TooltipTrigger } from '@tamery/ui/components/tooltip'
import { useSubscription } from 'seitu/react'

import { updatesStore } from '~/use-updates-observer'

export function UpdateButton() {
  const status = useSubscription(updatesStore, { selector: state => state.status })

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
        {status === 'checking' && <Spinner className="size-4 text-muted-foreground" />}
        {status === 'downloading' && (
          <RiDownloadLine className="size-3 animate-bounce text-muted-foreground" />
        )}
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {status === 'checking' && 'Checking for updates…'}
        {status === 'downloading' && 'Downloading update…'}
      </TooltipContent>
    </Tooltip>
  )
}
