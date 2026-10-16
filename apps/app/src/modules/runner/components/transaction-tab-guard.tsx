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

import { getConnectionResourceStore } from '~/core/connection/stores'
import { permix } from '~/core/user/permissions'

import { runnerTransaction } from '../lib/transaction'

/** Without `tab.multiple` opening a tab replaces the only one, which would roll back a query tab's open transaction unasked. */
export const TransactionTabGuard = () => {
  const { proceed, reset, status } = useBlocker({
    // In Electron a beforeunload veto cancels closing the window with no prompt.
    enableBeforeUnload: false,
    shouldBlockFn: ({ next }) => {
      if (
        permix.check('tab.multiple') ||
        next.routeId !== '/_protected/connection/$resourceId/$tabId'
      ) {
        return false
      }
      const { resourceId, tabId } = next.params
      return getConnectionResourceStore(resourceId)
        .get()
        .tabs.some(
          (tab) =>
            tab.id !== tabId &&
            runnerTransaction.state({ resourceId, tabId: tab.id }).get()
        )
    },
    withResolver: true,
  })

  return (
    <AlertDialog
      open={status === 'blocked'}
      onOpenChange={(open) => !open && reset?.()}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Roll back the transaction?</AlertDialogTitle>
          <AlertDialogDescription>
            Without an account one tab stays open, so opening this closes the
            query tab and rolls back its open transaction.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline">
            Keep transaction
          </AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={() => proceed?.()}>
            Roll back
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
