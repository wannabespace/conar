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

import { posthog } from '~/lib/posthog'

export const UnsavedChangesGuard = ({
  isDirty,
}: {
  isDirty: () => boolean
}) => {
  const { proceed, reset, status } = useBlocker({
    // In Electron a beforeunload veto cancels closing the window with no prompt.
    enableBeforeUnload: false,
    shouldBlockFn: isDirty,
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
            Your edits aren’t saved.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline">Keep editing</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => {
              posthog.capture('unsaved_changes_discarded')
              proceed?.()
            }}
          >
            Discard
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
