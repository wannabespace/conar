import { Tick02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import { ElapsedSeconds } from '@tamery/ui/components/custom/elapsed-seconds'
import { NumberFlow } from '@tamery/ui/components/custom/number-flow'
import { DialogClose, DialogFooter } from '@tamery/ui/components/dialog'

import type { CopyLogLine } from './copy-log'
import { CopyLog } from './copy-log'

export type CopyStatus = 'copying' | 'copied' | 'stopped' | 'failed'

export const CopyProgress = ({
  copiedAt,
  entries,
  onBack,
  onStop,
  since,
  status,
}: {
  /** When the copy committed; set only once it has. */
  copiedAt: number | undefined
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
          {status === 'copied' && copiedAt && (
            <span className="text-foreground flex items-center gap-1.5">
              <HugeiconsIcon
                icon={Tick02Icon}
                strokeWidth={2.5}
                className="text-success size-4"
              />
              <span>
                Copied {tables} in{' '}
                {Math.max(1, Math.round((copiedAt - since) / 1000))}s
              </span>
            </span>
          )}
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
