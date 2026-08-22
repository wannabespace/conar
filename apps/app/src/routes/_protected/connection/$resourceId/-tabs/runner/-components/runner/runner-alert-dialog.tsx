import { RiAlertLine } from '@remixicon/react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@tamery/ui/components/alert-dialog'
import { KbdShiftCtrlEnter } from '@tamery/ui/components/custom/shortcuts'
import { useHotkey } from '@tanstack/react-hotkeys'
import { useImperativeHandle, useRef, useState } from 'react'

import { DANGEROUS_SQL_KEYWORDS } from '~/entities/connection/utils'

const dangerousKeywordsPattern = DANGEROUS_SQL_KEYWORDS.map(
  (keyword) => `\\b${keyword}\\b`
).join('|')

export const RunnerAlertDialog = ({
  ref,
}: {
  ref: React.RefObject<{
    confirm: (queries: string[], callback: () => void) => void
  } | null>
}) => {
  const [open, setOpen] = useState(false)
  const [queries, setQueries] = useState<string[]>([])
  const dangerousKeywords = queries.flatMap(
    (query) => query.match(new RegExp(dangerousKeywordsPattern, 'giu')) || []
  )
  const uniqueDangerousKeywords = [
    ...new Set(dangerousKeywords.map((k) => k.toUpperCase())),
  ]
  const callbackRef = useRef<() => void>(null)

  useImperativeHandle(ref, () => ({
    confirm: (pendingQueries, c) => {
      setQueries(pendingQueries)
      setOpen(true)
      callbackRef.current = c
    },
  }))

  const onConfirm = () => {
    callbackRef.current?.()
    setOpen(false)
  }

  useHotkey('Mod+Shift+Enter', onConfirm, { enabled: open })

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) {
          callbackRef.current = null
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <RiAlertLine className="text-warning size-5" />
            Potentially Dangerous SQL Query
          </AlertDialogTitle>
          <AlertDialogDescription>
            <span className="border-warning/20 bg-warning/10 mb-3 block rounded-md border p-3">
              Your query contains potentially dangerous SQL keywords:
              <span className="text-warning font-semibold">
                {' '}
                {uniqueDangerousKeywords.join(', ')}
              </span>
            </span>
            <span className="mt-2">
              These operations could modify or delete data in your database.
              Proceed if you understand the impact of these changes.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel variant="outline">Cancel</AlertDialogCancel>
          <AlertDialogCancel variant="warning" onClick={onConfirm}>
            <span className="flex items-center gap-2">
              Run Anyway
              <KbdShiftCtrlEnter
                userAgent={navigator.userAgent}
                className="text-white"
              />
            </span>
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
