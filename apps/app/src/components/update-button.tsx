import { RiDownloadLine, RiRefreshLine } from '@remixicon/react'
import { pick } from '@tamery/shared/utils/helpers'
import { Button } from '@tamery/ui/components/button'
import { Spinner } from '@tamery/ui/components/spinner'
import { Tooltip, TooltipContent, TooltipTrigger } from '@tamery/ui/components/tooltip'
import { useSubscription } from 'seitu/react'
import { checkForUpdates, updatesStore } from '~/use-updates-observer'

export function UpdateButton() {
  const { version, status } = useSubscription(updatesStore, { selector: state => pick(state, ['version', 'status']) })

  if (!window.electron) {
    return null
  }

  if (status === 'ready') {
    return (
      <Button
        size="xs"
        onClick={() => window.electron?.app.quitAndInstall()}
      >
        <RiRefreshLine />
        Restart to update
      </Button>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger render={(
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Check for updates"
          disabled={status === 'checking' || status === 'downloading'}
          onClick={() => checkForUpdates()}
        />
      )}
      >
        {status === 'checking' && (
          <Spinner className="size-4 text-muted-foreground" />
        )}
        {status === 'downloading' && (
          <RiDownloadLine className="
            size-4 animate-bounce text-muted-foreground
          "
          />
        )}
        {(status === 'no-updates' || status === 'error') && (
          <RiRefreshLine className="size-4" />
        )}
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {status === 'checking' && 'Checking for updates…'}
        {status === 'downloading' && 'Downloading update…'}
        {status === 'error' && 'Update failed — click to retry'}
        {status === 'no-updates' && (
          <>
            v
            {version}
            {' · check for updates'}
          </>
        )}
      </TooltipContent>
    </Tooltip>
  )
}
