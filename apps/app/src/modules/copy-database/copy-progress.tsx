import { Button } from '@tamery/ui/components/button'
import { ElapsedSeconds } from '@tamery/ui/components/custom/elapsed-seconds'
import { NumberFlow } from '@tamery/ui/components/custom/number-flow'
import { DialogClose, DialogFooter } from '@tamery/ui/components/dialog'

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
}) => {
  const tablesCopied = entries.filter(
    ({ object }) => object === 'TABLE DATA'
  ).length
  const tables = (
    <NumberFlow
      value={tablesCopied}
      suffix={tablesCopied === 1 ? ' table' : ' tables'}
      className="tabular-nums"
    />
  )

  return (
    <>
      {(status === 'copying' || entries.length > 0) && (
        <CopyLog entries={entries} />
      )}
      <DialogFooter>
        <p className="text-muted-foreground mr-auto flex min-w-0 items-center gap-2 self-center">
          {status === 'copying' && (
            <span>
              Copying {tables} · <ElapsedSeconds since={since} />
            </span>
          )}
          {status === 'copied' && <span>Copied {tables}</span>}
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
}
