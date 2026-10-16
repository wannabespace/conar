import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@tamery/ui/components/alert-dialog'
import type { ShouldBlockFn } from '@tanstack/react-router'
import { useBlocker } from '@tanstack/react-router'

export const NavigationGuard = ({
  cancel,
  confirm,
  description,
  onConfirm,
  shouldBlock,
  title,
}: {
  cancel: string
  confirm: string
  description: string
  onConfirm?: () => void
  shouldBlock: ShouldBlockFn
  title: string
}) => {
  const { proceed, reset, status } = useBlocker({
    // In Electron a beforeunload veto cancels closing the window with no prompt.
    enableBeforeUnload: false,
    shouldBlockFn: shouldBlock,
    withResolver: true,
  })

  return (
    <AlertDialog
      open={status === 'blocked'}
      onOpenChange={(open) => !open && reset?.()}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline">{cancel}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => {
              onConfirm?.()
              proceed?.()
            }}
          >
            {confirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
