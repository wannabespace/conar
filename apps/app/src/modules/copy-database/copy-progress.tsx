import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@tamery/ui/components/alert'
import { Button } from '@tamery/ui/components/button'
import { ElapsedSeconds } from '@tamery/ui/components/custom/elapsed-seconds'
import { DialogClose, DialogFooter } from '@tamery/ui/components/dialog'
import { Spinner } from '@tamery/ui/components/spinner'

import { CopyLog } from './copy-log'
import type { CopyEnd } from './target-select'
import { CopyEndLabel } from './target-select'

export type CopyStatus = 'copying' | 'copied' | 'stopped' | 'failed'

export const CopyProgress = ({
  error,
  lines,
  onBack,
  onStop,
  since,
  status,
  target,
}: {
  error: Error | null
  lines: string[]
  onBack: () => void
  onStop: () => void
  since: number
  status: CopyStatus
  target: CopyEnd
}) => (
  <>
    <CopyLog lines={lines} />
    {status === 'failed' && error && (
      <Alert variant="destructive">
        <AlertTitle data-mask className="wrap-break-word">
          {error.message}
        </AlertTitle>
        <AlertDescription>
          Nothing changed in <CopyEndLabel {...target} />.
        </AlertDescription>
      </Alert>
    )}
    <DialogFooter>
      <p className="text-muted-foreground mr-auto flex min-w-0 items-center gap-2 self-center">
        {status === 'copying' && (
          <>
            <Spinner />
            <span>
              Copying <ElapsedSeconds since={since} />
            </span>
          </>
        )}
        {status === 'copied' && (
          <span className="min-w-0 truncate">
            Copied to <CopyEndLabel {...target} />
          </span>
        )}
        {status === 'stopped' && (
          <span className="min-w-0 truncate">
            Stopped. <CopyEndLabel {...target} /> is unchanged.
          </span>
        )}
      </p>
      {status === 'copying' ? (
        <Button variant="outline" onClick={onStop}>
          Stop
        </Button>
      ) : (
        <>
          {status !== 'copied' && (
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
          )}
          <DialogClose render={<Button />}>Done</DialogClose>
        </>
      )}
    </DialogFooter>
  </>
)
