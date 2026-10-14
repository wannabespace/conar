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
import { useBlocker } from '@tanstack/react-router'

import type { ConnectionForm } from '../lib/connection-form'

export const UnsavedChangesGuard = ({ form }: { form: ConnectionForm }) => {
  const { proceed, reset, status } = useBlocker({
    // In Electron a beforeunload veto cancels closing the window with no prompt.
    enableBeforeUnload: false,
    shouldBlockFn: () => !form.state.isDefaultValue,
    withResolver: true,
  })

  return (
    <AlertDialog
      open={status === 'blocked'}
      onOpenChange={(open) => !open && reset?.()}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Discard changes?</AlertDialogTitle>
          <AlertDialogDescription>
            Your edits to this connection aren’t saved.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline">Keep editing</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={() => proceed?.()}>
            Discard
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
