import { isCtrlEnter } from '@conar/shared/utils/os'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@conar/ui/components/alert-dialog'
import { ShiftCtrlEnter } from '@conar/ui/components/custom/shortcuts'
import { useKeyboardEvent } from '@react-hookz/web'
import { RiAlertLine } from '@remixicon/react'
import { useImperativeHandle, useRef, useState } from 'react'
import { DANGEROUS_SQL_KEYWORDS } from '~/entities/database'

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
  const callback = useRef<() => void>(null)

  useImperativeHandle(ref, () => ({
    confirm: (queries, c) => {
      setQueries(queries)
      setOpen(true)
      callback.current = c
    },
  }))

  const onConfirm = () => {
    callback.current?.()
    setOpen(false)
  }

  useKeyboardEvent(e => isCtrlEnter(e) && e.shiftKey, onConfirm)

  return (
    <AlertDialog
      open={open}
      onOpenChange={(open) => {
        setOpen(open)
        if (!open) {
          callback.current = null
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
            <span className="block rounded-md bg-warning/10 p-3 mb-3 border border-warning/20">
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
          <AlertDialogCancel className="border-muted-foreground/20">Cancel</AlertDialogCancel>
          <AlertDialogAction variant="warning" onClick={onConfirm}>
            <span className="flex items-center gap-2">
              Run Anyway
              <ShiftCtrlEnter userAgent={navigator.userAgent} />
            </span>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
