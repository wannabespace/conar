import { Button } from '@tamery/ui/components/button'
import { ElapsedSeconds } from '@tamery/ui/components/custom/elapsed-seconds'
import { DialogClose, DialogFooter } from '@tamery/ui/components/dialog'
import { Spinner } from '@tamery/ui/components/spinner'

import type { CopyLogLine } from './copy-log'
import { CopyLog } from './copy-log'

export type CopyStatus = 'copying' | 'copied' | 'stopped' | 'failed'

export const CopyProgress = ({
  entries,
  onBack,
  onStop,
  since,
  status,
}: {
  entries: CopyLogLine[]
  onBack: () => void
  onStop: () => void
  since: number
  status: CopyStatus
}) => (
  <>
    {(status === 'copying' || entries.length > 0) && (
      <CopyLog entries={entries} />
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
        {status === 'copied' && <span>Copied</span>}
        {status === 'stopped' && <span>Stopped. Nothing changed.</span>}
        {status === 'failed' && <span>Failed. Nothing changed.</span>}
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
