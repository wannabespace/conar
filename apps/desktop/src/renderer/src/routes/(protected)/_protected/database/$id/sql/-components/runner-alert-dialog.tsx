import { isCtrlEnter } from '@conar/shared/utils/os'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@conar/ui/components/alert-dialog'
import { ShiftCtrlEnter } from '@conar/ui/components/custom/ctrl-enter'
import { useKeyboardEvent } from '@react-hookz/web'
import { RiAlertLine } from '@remixicon/react'
import { DANGEROUS_SQL_KEYWORDS } from '~/entities/database'

export function RunnerAlertDialog({ open, setOpen, confirm, query }: { open: boolean, setOpen: (open: boolean) => void, confirm: () => void, query: string }) {
  const uncommentedLines = query.split('\n').filter(line => !line.trim().startsWith('--')).join('\n')
  const dangerousKeywordsPattern = DANGEROUS_SQL_KEYWORDS.map(keyword => `\\b${keyword}\\b`).join('|')
  const dangerousKeywords = uncommentedLines.match(new RegExp(dangerousKeywordsPattern, 'gi')) || []
  const uniqueDangerousKeywords = [...new Set(dangerousKeywords.map(k => k.toUpperCase()))]

  useKeyboardEvent(e => isCtrlEnter(e) && e.shiftKey, () => {
    confirm()
    setOpen(false)
  })

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
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
          <AlertDialogAction variant="warning" onClick={confirm}>
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
