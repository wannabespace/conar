import { AlertDialog, AlertDialogClose, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@conar/ui/components/alert-dialog'
import { Button } from '@conar/ui/components/button'
import { KbdShiftCtrlEnter } from '@conar/ui/components/custom/shortcuts'
import { RiAlertLine } from '@remixicon/react'
import { useHotkey } from '@tanstack/react-hotkeys'
import { useImperativeHandle, useRef, useState } from 'react'
import { DANGEROUS_SQL_KEYWORDS } from '~/entities/connection/utils'

const dangerousKeywordsPattern = DANGEROUS_SQL_KEYWORDS.map(keyword => `\\b${keyword}\\b`).join('|')

export function RunnerAlertDialog({
  ref,
}: {
  ref: React.RefObject<{ confirm: (queries: string[], callback: () => void) => void } | null>
}) {
  const [open, setOpen] = useState(false)
  const [queries, setQueries] = useState<string[]>([])
  const dangerousKeywords = queries.flatMap(query => query.match(new RegExp(dangerousKeywordsPattern, 'gi')) || [])
  const uniqueDangerousKeywords = [...new Set(dangerousKeywords.map(k => k.toUpperCase()))]
  const callbackRef = useRef<() => void>(null)

  useImperativeHandle(ref, () => ({
    confirm: (queries, c) => {
      setQueries(queries)
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
      onOpenChange={(open) => {
        setOpen(open)
        if (!open) {
          callbackRef.current = null
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <RiAlertLine className="size-5 text-warning" />
            Potentially Dangerous SQL Query
          </AlertDialogTitle>
          <AlertDialogDescription>
            <span className="
              mb-3 block rounded-md border border-warning/20 bg-warning/10 p-3
            "
            >
              Your query contains potentially dangerous SQL keywords:
              <span className="font-semibold text-warning">
                {' '}
                {uniqueDangerousKeywords.join(', ')}
              </span>
            </span>
            <span className="mt-2">
              These operations could modify or delete data in your database. Proceed if you understand the impact of these changes.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogClose render={<Button variant="outline" />}>Cancel</AlertDialogClose>
          <AlertDialogClose render={<Button variant="warning" />} onClick={onConfirm}>
            <span className="flex items-center gap-2">
              Run Anyway
              <KbdShiftCtrlEnter
                userAgent={navigator.userAgent}
                className="text-white"
              />
            </span>
          </AlertDialogClose>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
