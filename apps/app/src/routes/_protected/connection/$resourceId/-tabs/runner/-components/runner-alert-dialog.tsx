import { Alert02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@tamery/ui/components/alert-dialog'
import { KbdCtrlEnter } from '@tamery/ui/components/custom/shortcuts'
import { useHotkey } from '@tanstack/react-hotkeys'
import { useImperativeHandle, useRef, useState } from 'react'

export const RunnerAlertDialog = ({
  ref,
  onOpenChange,
}: {
  ref: React.RefObject<{
    confirm: (keywords: string[], onConfirmed: () => void) => void
  } | null>
  /** The runner turns its own ⌘↩ and ⌘⇧↩ off while this is open, or one press would confirm and ask again. */
  onOpenChange: (open: boolean) => void
}) => {
  const [open, setOpen] = useState(false)
  const changeOpen = (next: boolean) => {
    setOpen(next)
    onOpenChange(next)
  }
  const [keywords, setKeywords] = useState<string[]>([])
  const callbackRef = useRef<() => void>(null)

  useImperativeHandle(ref, () => ({
    confirm: (pendingKeywords, onConfirmed) => {
      setKeywords(pendingKeywords)
      changeOpen(true)
      callbackRef.current = onConfirmed
    },
  }))

  const onConfirm = () => {
    callbackRef.current?.()
    changeOpen(false)
  }

  useHotkey('Mod+Enter', onConfirm, { enabled: open })

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        changeOpen(nextOpen)
        if (!nextOpen) {
          callbackRef.current = null
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <HugeiconsIcon
              icon={Alert02Icon}
              strokeWidth={2}
              className="text-warning size-5"
            />
            This changes data
          </AlertDialogTitle>
          <AlertDialogDescription>
            The statements run{' '}
            <span className="text-warning font-semibold">
              {keywords.join(', ')}
            </span>
            , which can modify or delete data in the database.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel variant="outline">Cancel</AlertDialogCancel>
          <AlertDialogCancel variant="warning" onClick={onConfirm}>
            Run anyway
            <KbdCtrlEnter userAgent={navigator.userAgent} />
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
