import { toError } from '@tamery/shared/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@tamery/ui/components/dialog'
import { useMutation } from '@tanstack/react-query'
import { Result } from 'better-result'
import { createRef, useImperativeHandle, useState } from 'react'
import { v7 as uuidv7 } from 'uuid'

import { refreshCatalog } from '~/core/connection/refresh-after-run'
import { connectionResourceToQueryParams } from '~/core/runtime/query'

import { CopyForm } from './copy-form'
import type { CopyStatus } from './copy-progress'
import { CopyProgress } from './copy-progress'
import type { TableSelection } from './tables-field'
import type { CopyEnd } from './target-select'
import { CopyEndLabel } from './target-select'

interface CopyRun {
  id: string
  source: CopyEnd
  tables: TableSelection
  target: CopyEnd
}

export const copyDatabaseDialogRef = createRef<{
  open: (source: CopyEnd) => void
}>()

export const CopyDatabaseDialog = () => {
  const [open, setOpen] = useState(false)
  const [source, setSource] = useState<CopyEnd | null>(null)
  const [target, setTarget] = useState<CopyEnd | null>(null)
  const [selection, setSelection] = useState<TableSelection>(null)
  const [lines, setLines] = useState<string[]>([])
  const [stopped, setStopped] = useState(false)

  const copy = useMutation({
    meta: { event: 'database_copied' },
    mutationFn: async (run: CopyRun) => {
      setLines([])
      setStopped(false)
      const unsubscribe = window.electron?.copyDatabase.onLog(
        ({ copyId, line }) => {
          if (copyId === run.id) {
            setLines((previous) => [...previous, line])
          }
        }
      )
      const copied = await Result.tryPromise(async () => {
        const [from, to] = await Promise.all([
          connectionResourceToQueryParams(run.source.resource),
          connectionResourceToQueryParams(run.target.resource),
        ])
        await window.electron?.copyDatabase.start({
          id: run.id,
          source: from.connectionString,
          tables: run.tables && [...run.tables.values()],
          target: to.connectionString,
        })
      })
      unsubscribe?.()
      if (copied.isErr()) {
        throw toError(copied.error.cause)
      }
    },
    onSuccess: (_, run) => refreshCatalog(run.target.resource),
  })

  useImperativeHandle(copyDatabaseDialogRef, () => ({
    open: (next) => {
      copy.reset()
      setSource(next)
      setTarget(null)
      setSelection(null)
      setOpen(true)
    },
  }))

  const stop = () => {
    if (copy.variables) {
      setStopped(true)
      void window.electron?.copyDatabase.cancel(copy.variables.id)
    }
  }

  let status: CopyStatus = 'copying'
  if (copy.isSuccess) {
    status = 'copied'
  } else if (copy.isError) {
    status = stopped ? 'stopped' : 'failed'
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Escape first stops a running copy, then closes: a stopped copy changes nothing, so the press is safe.
        if (copy.isPending) {
          stop()
        } else {
          setOpen(next)
        }
      }}
    >
      {source && (
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copy database</DialogTitle>
            <DialogDescription>
              <CopyEndLabel {...source} />
              {copy.variables && (
                <>
                  {' to '}
                  <CopyEndLabel {...copy.variables.target} />
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {copy.variables ? (
            <CopyProgress
              error={copy.error}
              lines={lines}
              since={copy.submittedAt}
              status={status}
              target={copy.variables.target}
              onBack={() => copy.reset()}
              onStop={stop}
            />
          ) : (
            <CopyForm
              source={source}
              target={target}
              selection={selection}
              onTargetChange={setTarget}
              onSelectionChange={setSelection}
              onSubmit={(picked) =>
                copy.mutate({
                  id: uuidv7(),
                  source,
                  tables: selection,
                  target: picked,
                })
              }
            />
          )}
        </DialogContent>
      )}
    </Dialog>
  )
}
