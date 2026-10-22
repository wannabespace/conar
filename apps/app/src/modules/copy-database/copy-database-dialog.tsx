import { getDialect } from '@tamery/shared/enums/connection-type'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@tamery/ui/components/dialog'
import { useMutation } from '@tanstack/react-query'
import { createRef, useImperativeHandle, useState } from 'react'
import { v7 as uuidv7 } from 'uuid'

import { getCapabilities } from '~/core/catalog/capabilities'
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
  stop: AbortController
  tables: TableSelection
  target: CopyEnd
}

export const copyDatabaseDialogRef = createRef<{
  open: (source: CopyEnd) => void
}>()

export const getCopyDatabaseAction = (source: CopyEnd | null) =>
  window.electron &&
  source &&
  getCapabilities(getDialect(source.connection.type)).copyDatabase
    ? () => copyDatabaseDialogRef.current?.open(source)
    : null

const startCopy = async (run: CopyRun) => {
  const [from, to] = await Promise.all([
    connectionResourceToQueryParams(run.source.resource),
    connectionResourceToQueryParams(run.target.resource),
  ])
  run.stop.signal.throwIfAborted()
  run.stop.signal.addEventListener('abort', () => {
    void window.electron?.copyDatabase.cancel(run.id)
  })
  await window.electron?.copyDatabase.start({
    id: run.id,
    source: from.connectionString,
    tables: run.tables && [...run.tables.values()],
    target: to.connectionString,
  })
}

export const CopyDatabaseDialog = () => {
  const [open, setOpen] = useState(false)
  const [source, setSource] = useState<CopyEnd | null>(null)
  const [target, setTarget] = useState<CopyEnd | null>(null)
  const [selection, setSelection] = useState<TableSelection>(null)
  const [lines, setLines] = useState<string[]>([])

  const copy = useMutation({
    meta: { event: 'database_copied' },
    mutationFn: (run: CopyRun) => {
      const unsubscribe = window.electron?.copyDatabase.onLog(
        ({ copyId, line }) => {
          if (copyId === run.id) {
            setLines((previous) => [...previous, line])
          }
        }
      )
      return startCopy(run).finally(() => unsubscribe?.())
    },
    onMutate: () => setLines([]),
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

  const stop = () => copy.variables?.stop.abort()

  let status: CopyStatus = 'copying'
  if (copy.isSuccess) {
    status = 'copied'
  } else if (copy.isError) {
    status = copy.variables?.stop.signal.aborted ? 'stopped' : 'failed'
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
                  stop: new AbortController(),
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
